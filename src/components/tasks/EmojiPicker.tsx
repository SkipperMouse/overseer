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

export default function EmojiPicker({onSelect, onClose}: Props) {
    return (
        <div className="emoji-overlay" onClick={onClose}>
            <div className="emoji-grid" onClick={e => e.stopPropagation()}>
                {EMOJIS.map(em => (
                    <button
                        key={em}
                        className="emoji-btn"
                        onClick={() => {
                            onSelect(em);
                            onClose()
                        }}
                    >
                        <span className="pip-emoji">{em}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
