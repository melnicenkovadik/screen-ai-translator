import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';

export class QuestionsView extends LitElement {
    static properties = {
        queue: { type: Array },
        isActive: { type: Boolean },
        isRefreshing: { type: Boolean },
    };

    static styles = css`
        :host {
            display: block;
            width: 100%;
            height: 100%;
            min-height: 0;
        }

        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
            box-sizing: border-box;
        }

        .assistant-container {
            display: flex;
            flex-direction: column;
            color: #ffffff;
            box-sizing: border-box;
            position: relative;
            background: rgba(0, 0, 0, 0.72);
            overflow: hidden;
            border-radius: 12px;
            width: 100%;
            height: 100%;
            min-height: 0;
        }

        .assistant-container::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 12px;
            padding: 1px;
            background: linear-gradient(169deg, rgba(255, 255, 255, 0.17) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.17) 100%);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: destination-out;
            mask-composite: exclude;
            pointer-events: none;
        }

        .assistant-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.25);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            z-index: -1;
        }

        .questions-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 16px;
            min-height: 32px;
            flex-shrink: 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .questions-count {
            color: #ffffff;
            font-size: 13px;
            font-weight: 500;
        }

        .refresh-btn {
            display: flex;
            align-items: center;
            gap: 5px;
            background: transparent;
            color: rgba(255, 255, 255, 0.9);
            border: none;
            outline: none;
            box-shadow: none;
            padding: 4px 8px;
            border-radius: 5px;
            font-size: 11px;
            font-weight: 500;
            cursor: default;
            height: 24px;
            white-space: nowrap;
            transition: background-color 0.15s ease;
        }

        .refresh-btn:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.1);
        }

        .refresh-btn:disabled {
            opacity: 0.4;
        }

        .questions-list {
            overflow-y: auto;
            overflow-x: hidden;
            padding: 4px 8px 12px 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-height: 0;
            flex: 1;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
        }

        .questions-list::-webkit-scrollbar {
            width: 8px;
        }
        .questions-list::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
        }
        .questions-list::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
        }
        .questions-list::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
        }

        .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100px;
            color: rgba(255, 255, 255, 0.5);
            font-size: 12px;
            font-style: italic;
        }

        .question-item {
            background: rgba(255, 255, 255, 0.06);
            border-radius: 8px;
            padding: 8px 10px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            transition: background 0.15s ease;
        }

        .question-item:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .question-item.answering {
            opacity: 0.7;
        }

        .question-text {
            color: #ffffff;
            font-size: 12px;
            line-height: 1.4;
            word-wrap: break-word;
            user-select: text;
        }

        .question-error {
            color: rgba(255, 100, 100, 0.9);
            font-size: 10px;
        }

        .question-actions {
            display: flex;
            gap: 6px;
            align-items: center;
        }

        .answer-btn {
            background: rgba(0, 122, 255, 0.6);
            color: #fff;
            border: none;
            border-radius: 5px;
            padding: 3px 10px;
            font-size: 11px;
            cursor: default;
            transition: background 0.15s ease;
        }

        .answer-btn:hover:not(:disabled) {
            background: rgba(0, 122, 255, 0.85);
        }

        .answer-btn:disabled {
            opacity: 0.4;
        }

        .dismiss-btn {
            background: transparent;
            color: rgba(255, 255, 255, 0.5);
            border: none;
            padding: 3px 6px;
            font-size: 11px;
            cursor: default;
            transition: color 0.15s ease;
        }

        .dismiss-btn:hover {
            color: rgba(255, 100, 100, 0.9);
        }

        .spinner {
            display: inline-block;
            width: 10px;
            height: 10px;
            border: 1.5px solid rgba(255, 255, 255, 0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
            margin-right: 4px;
            vertical-align: middle;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* ────────────────[ GLASS BYPASS ]─────────────── */
        :host-context(body.has-glass) .assistant-container,
        :host-context(body.has-glass) .questions-header,
        :host-context(body.has-glass) .question-item,
        :host-context(body.has-glass) .refresh-btn,
        :host-context(body.has-glass) .answer-btn {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            filter: none !important;
            backdrop-filter: none !important;
        }
        :host-context(body.has-glass) .assistant-container::before,
        :host-context(body.has-glass) .assistant-container::after {
            display: none !important;
        }
        :host-context(body.has-glass) .assistant-container,
        :host-context(body.has-glass) .question-item {
            border-radius: 0 !important;
        }
        :host-context(body.has-glass) .questions-list::-webkit-scrollbar-track,
        :host-context(body.has-glass) .questions-list::-webkit-scrollbar-thumb {
            background: transparent !important;
        }
        :host-context(body.has-glass) * {
            animation: none !important;
            transition: none !important;
        }
    `;

    constructor() {
        super();
        this.queue = [];
        this.isActive = false;
        this.isRefreshing = false;
    }

    connectedCallback() {
        super.connectedCallback();
        if (window.api?.questionsView) {
            this._stateListener = (event, state) => {
                this.queue = state.queue || [];
                this.isActive = state.isActive;
                this.isRefreshing = state.isRefreshing;
            };
            window.api.questionsView.onStateUpdate(this._stateListener);
            window.api.questionsView.getState().then(state => {
                this.queue = state.queue || [];
                this.isActive = state.isActive;
                this.isRefreshing = state.isRefreshing;
            });
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (window.api?.questionsView && this._stateListener) {
            window.api.questionsView.removeOnStateUpdate(this._stateListener);
        }
    }

    async handleRefresh() {
        await window.api?.questionsView?.refresh();
    }

    async handleAnswer(id) {
        await window.api?.questionsView?.answer(id);
    }

    handleDismiss(id) {
        window.api?.questionsView?.dismiss(id);
    }

    render() {
        const pendingCount = this.queue.length;

        return html`
            <div class="assistant-container">
                <div class="questions-header">
                    <span class="questions-count">Questions (${pendingCount})</span>
                    <button class="refresh-btn"
                            ?disabled=${this.isRefreshing || pendingCount === 0}
                            @click=${this.handleRefresh}>
                        ${this.isRefreshing
                            ? html`<span class="spinner"></span>Refreshing`
                            : 'Refresh'}
                    </button>
                </div>
                <div class="questions-list">
                    ${pendingCount === 0
                        ? html`<div class="empty-state">
                            ${this.isActive
                                ? 'Listening for questions...'
                                : 'Toggle Q&A to start tracking'}
                          </div>`
                        : this.queue.map(item => html`
                            <div class="question-item ${item.status}">
                                <div class="question-text">${item.refinedText || item.rawText}</div>
                                ${item.error
                                    ? html`<div class="question-error">${item.error}</div>`
                                    : ''}
                                <div class="question-actions">
                                    <button class="answer-btn"
                                            ?disabled=${item.status === 'answering' || this.isRefreshing}
                                            @click=${() => this.handleAnswer(item.id)}>
                                        ${item.status === 'answering'
                                            ? html`<span class="spinner"></span>Sending`
                                            : 'Answer'}
                                    </button>
                                    <button class="dismiss-btn"
                                            @click=${() => this.handleDismiss(item.id)}>
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        `)
                    }
                </div>
            </div>
        `;
    }
}

customElements.define('questions-view', QuestionsView);
