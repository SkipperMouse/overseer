import { useState } from 'react'

const EMOJIS = [
    '⏳', '🔧', '🛒', '🛀🏻', '📚', '🖋️', '💻', '🍳',
    '🏚️', '🏛️', '⛪️', '✈️', '☎️', '🚓', '🕯️', '💡',
    '📦', '💼', '🎯', '📅', '🛢️', '🍌', '☕', '🍎',
    '🤠', '🤯', '🤮', '🤕', '🐙', '💩', '🤡', '🤢',
    '💋', '🥇', '❓', '💤', '🦿', '🫆', '⚡', '🌙',
    '👾', '👻', '👽', '☠️', '🤖', '🧘', '🧟‍♂️', '🕵🏻‍♂️',
    '🧠', '🦾', '👁️', '👀', '👣', '🫀', '🦷', '🫁',
]

interface Props {
    onSelect: (emoji: string) => void
    onClose: () => void
}

export default function EmojiPicker({ onSelect, onClose }: Props) {
    const [customVal, setCustomVal] = useState('')

    function confirm() {
        if (!customVal) return
        onSelect(customVal)
        onClose()
        setCustomVal('')
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value
        if (!value) { setCustomVal(''); return }
        // Intl.Segmenter handles ZWJ sequences (flags, family emojis, etc.)
        const segments = [...new Intl.Segmenter().segment(value)]
        setCustomVal(segments[0]?.segment ?? '')
    }

    return (
        <div className="emoji-overlay" onClick={onClose}>
            <div className="emoji-grid" onClick={e => e.stopPropagation()}>
                {EMOJIS.map(em => (
                    <button
                        key={em}
                        className="emoji-btn"
                        onClick={() => { onSelect(em); onClose() }}
                    >
                        <span className="pip-emoji">{em}</span>
                    </button>
                ))}
                <div className="emoji-custom-row" onClick={e => e.stopPropagation()}>
                    <div className="emoji-custom-field">
                        {customVal === '' && <span className="blink-cursor emoji-custom-cursor" />}
                        <input
                            className="emoji-custom-input"
                            value={customVal}
                            onChange={handleChange}
                            onKeyDown={e => {
                                if (e.key === 'Enter') confirm()
                                if (e.key === 'Escape') setCustomVal('')
                            }}
                        />
                    </div>
                    <button
                        className="emoji-confirm-btn"
                        style={{ opacity: customVal ? 1 : 0.3, pointerEvents: customVal ? 'auto' : 'none' }}
                        onClick={confirm}
                    >
                        [ ок ]
                    </button>
                </div>
            </div>
        </div>
    )
}
