class NameOverlay extends naver.maps.OverlayView {
  constructor(position, name) {
    super();
    this._element = null;
    this._position = position;
    this._name = name;
    this.setMap(map); // 지도에 추가
  }

  onAdd() {
    var overlayEl = document.createElement("div");
    overlayEl.className = "name-overlay";
    overlayEl.innerHTML = this._name;

    this._element = overlayEl;

    var overlayLayer = this.getPanes().overlayLayer;
    overlayLayer.appendChild(this._element);
  }

  draw() {
    var projection = this.getProjection();
    var position = this._position;
    var pixelPosition = projection.fromCoordToOffset(position);

    // 위치 조정 (중앙 상단)
    this._element.style.left = (pixelPosition.x - this._element.offsetWidth / 2) + "px";
    this._element.style.top = (pixelPosition.y - 40) + "px"; // 마커 위쪽
  }

  onRemove() {
    if (this._element) {
      this._element.parentNode.removeChild(this._element);
      this._element = null;
    }
  }
}