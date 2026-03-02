import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class SummaryView extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            min-height: 0;
        }

        .summary-container {
            overflow-y: auto !important;
            overflow-x: hidden;
            padding: 12px 16px 16px 16px;
            position: relative;
            z-index: 1;
            min-height: 0;
            flex: 1;
            height: 100%;
            box-sizing: border-box;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
        }

        .summary-container, .summary-container * {
            pointer-events: auto !important;
        }

        .summary-container::-webkit-scrollbar {
            width: 8px;
        }
        .summary-container::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
        }
        .summary-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
        }
        .summary-container::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
        }

        .summary-text {
            color: #ffffff;
            font-size: 12px;
            line-height: 1.5;
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif;
            white-space: pre-wrap;
            word-wrap: break-word;
            user-select: text;
            cursor: default;
        }

        .updating-indicator {
            display: inline-block;
            color: rgba(255, 255, 255, 0.5);
            font-size: 11px;
            margin-left: 2px;
            animation: blink 1s infinite;
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }

        .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100px;
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
            font-style: italic;
        }
    `;

    static properties = {
        summaryText: { type: String },
        isVisible: { type: Boolean },
        isUpdating: { type: Boolean },
    };

    constructor() {
        super();
        this.summaryText = '';
        this.isVisible = true;
        this.isUpdating = false;
        this._streamAccumulator = '';

        this._boundOnStreamStart = this._onStreamStart.bind(this);
        this._boundOnStreamChunk = this._onStreamChunk.bind(this);
        this._boundOnStreamDone = this._onStreamDone.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        if (window.api?.summaryView) {
            window.api.summaryView.onSummaryStreamStart(this._boundOnStreamStart);
            window.api.summaryView.onSummaryStreamChunk(this._boundOnStreamChunk);
            window.api.summaryView.onSummaryStreamDone(this._boundOnStreamDone);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (window.api?.summaryView) {
            window.api.summaryView.removeSummaryStreamStart(this._boundOnStreamStart);
            window.api.summaryView.removeSummaryStreamChunk(this._boundOnStreamChunk);
            window.api.summaryView.removeSummaryStreamDone(this._boundOnStreamDone);
        }
    }

    _onStreamStart(_event) {
        this.isUpdating = true;
        this._streamAccumulator = '';
        this.requestUpdate();
    }

    _onStreamChunk(_event, { chunk }) {
        this._streamAccumulator += chunk;
        this.summaryText = this._streamAccumulator;
        this.requestUpdate();
        this._scrollToBottom();
    }

    _onStreamDone(_event, { text }) {
        this.summaryText = text;
        this._streamAccumulator = '';
        this.isUpdating = false;
        this.requestUpdate();
    }

    _scrollToBottom() {
        requestAnimationFrame(() => {
            const container = this.shadowRoot?.querySelector('.summary-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        });
    }

    resetAnalysis() {
        this.summaryText = '';
        this._streamAccumulator = '';
        this.isUpdating = false;
        this.requestUpdate();
    }

    getSummaryText() {
        return this.summaryText || '';
    }

    render() {
        if (!this.isVisible) {
            return html`<div style="display: none;"></div>`;
        }

        const hasContent = this.summaryText && this.summaryText.trim().length > 0;

        return html`
            <div class="summary-container">
                ${!hasContent && !this.isUpdating
                    ? html`<div class="empty-state">Summary will appear after ~30s of conversation...</div>`
                    : html`
                        <div class="summary-text">${this.summaryText}${this.isUpdating ? html`<span class="updating-indicator">|</span>` : ''}</div>
                    `}
            </div>
        `;
    }
}

customElements.define('summary-view', SummaryView);
