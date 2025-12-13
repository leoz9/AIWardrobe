const API_BASE = `http://${window.location.hostname}:8000`

function Slider({ items, label, icon, onDelete }) {
    if (!items || items.length === 0) {
        return (
            <div className="slider-container">
                <div className="slider-label">
                    <span className="slider-label-icon">{icon}</span>
                    <span>{label}</span>
                    <span className="slider-count">0</span>
                </div>
                <div className="empty-slider">
                    <div className="empty-slider-icon">👔</div>
                    <p>暂无{label}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="slider-container">
            <div className="slider-label">
                <span className="slider-label-icon">{icon}</span>
                <span>{label}</span>
                <span className="slider-count">{items.length}</span>
            </div>
            <div className="slider">
                {items.map(item => (
                    <div className="slide" key={item.id}>
                        <div className="slide-image-container">
                            <img
                                src={`${API_BASE}${item.image_url}`}
                                alt={item.item}
                                className="slide-image"
                            />
                            <button
                                className="slide-delete"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete?.(item.id)
                                }}
                                title="删除"
                            >
                                ×
                            </button>
                        </div>
                        <div className="slide-content">
                            <h4 className="slide-item-name">{item.item}</h4>
                            <p className="slide-description">{item.description}</p>
                            <div className="slide-tags">
                                {item.style_semantics?.slice(0, 2).map((tag, i) => (
                                    <span key={i} className="slide-tag">{tag}</span>
                                ))}
                                {item.season_semantics?.slice(0, 2).map((tag, i) => (
                                    <span key={`s-${i}`} className="slide-tag">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function OutfitSlider({ tops, bottoms, shoes, onDelete }) {
    return (
        <div className="wardrobe-section">
            <Slider
                items={tops}
                label="上衣"
                icon="👕"
                onDelete={onDelete}
            />
            <Slider
                items={bottoms}
                label="下装"
                icon="👖"
                onDelete={onDelete}
            />
            <Slider
                items={shoes}
                label="鞋子"
                icon="👟"
                onDelete={onDelete}
            />
        </div>
    )
}
