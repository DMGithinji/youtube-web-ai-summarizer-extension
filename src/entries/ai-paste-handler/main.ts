import { AiServiceType } from '@/config/types';

interface PasteMessage {
  type: 'FROM_BACKGROUND';
  action: 'pasteText';
  data: {
    tabId: number;
    url: string;
  };
}

const SUBMIT_DELAY = 750; // ms to wait before submitting

// Editor selectors for different AI services
const EDITOR_SELECTORS = {
  [AiServiceType.CLAUDE]: 'div[contenteditable="true"].ProseMirror',
  [AiServiceType.CHATGPT]: 'div[contenteditable="true"].ProseMirror',
  [AiServiceType.GEMINI]: '.ql-editor[contenteditable="true"]'
} as const;

function detectAiService(url: string): AiServiceType | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('claude')) return AiServiceType.CLAUDE;
    if (urlObj.hostname.includes('chatgpt')) return AiServiceType.CHATGPT;
    if (urlObj.hostname.includes('gemini')) return AiServiceType.GEMINI;
    return null;
  } catch {
    return null;
  }
}

function getEditor(service: AiServiceType): HTMLElement | null {
  return document.querySelector(EDITOR_SELECTORS[service]);
}

// Create keyboard enter event
function createEnterEvent(): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
    composed: true,
    shiftKey: false,
    metaKey: false,
    ctrlKey: false
  });
}

// Submit the form using button or keyboard event
function submitForm(editor: HTMLElement, service: AiServiceType) {
  setTimeout(() => {
    if (service === AiServiceType.GEMINI) {
      // Try the send button first for Gemini
      const sendButton = document.querySelector('button[data-testid="send-button"]');
      if (sendButton) {
        (sendButton as HTMLButtonElement).click();
        return;
      }
    }

    // Fallback to keyboard events if button not found or for other services
    const enterEvent = createEnterEvent();
    editor.dispatchEvent(enterEvent);
    document.dispatchEvent(enterEvent);
  }, SUBMIT_DELAY);
}

async function pasteToEditor(service: AiServiceType): Promise<void> {
  try {
    // Get clipboard content
    const clipboardText = await navigator.clipboard.readText();
    if (!clipboardText) {
      throw new Error('No text in clipboard');
    }

    // Clear clipboard after reading
    await navigator.clipboard.writeText('');

    // Get editor element
    const editor = getEditor(service);
    if (!editor) {
      throw new Error('Editor not found');
    }

    // Handle Gemini's Quill editor
    if (service === AiServiceType.GEMINI) {
      editor.textContent = clipboardText;

      // Trigger Quill's specific events
      editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
      editor.dispatchEvent(new Event('change', { bubbles: true }));

      // Submit the form
      submitForm(editor, service);
      return;
    }

    // Handle Claude/ChatGPT ProseMirror editors
    // Clear any placeholder text
    const placeholder = editor.querySelector('p.is-empty');
    if (placeholder) {
      editor.innerHTML = '';
    }

    // Create and insert content
    const paragraph = document.createElement('p');
    paragraph.textContent = clipboardText;
    editor.appendChild(paragraph);

    // Trigger update events
    editor.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
    }));

    editor.dispatchEvent(new Event('change', {
      bubbles: true,
      cancelable: true
    }));

    // Submit the form
    submitForm(editor, service);

  } catch (error) {
    console.error('Paste error:', error);
    throw error;
  }
}

// Main message handler
chrome.runtime.onMessage.addListener((message: PasteMessage) => {
  if (message.type === 'FROM_BACKGROUND' && message.action === 'pasteText') {
    const service = detectAiService(message.data.url);

    if (service) {
      // Add a small delay to ensure editor is ready
      setTimeout(() => {
        pasteToEditor(service).catch(error => {
          console.error('Failed to paste text:', error);
        });
      }, 500);
    }
  }
});