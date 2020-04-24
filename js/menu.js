class Button {
    #lineWidth = 5;
    #radius = 8;
    constructor(x, y, w, h, isHighlighted, text, text2, font, action) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.isHighlighted = isHighlighted;
        this.text = text;
        this.text2 = text2;
        this.action = action;
        this.font = font;
    }

    draw(ctx) {
        var gradient = ctx.createRadialGradient((this.w / 2) + this.x, (this.h / 2) + this.y, Math.max(this.w, this.h) / 10, (this.w / 2) + this.x, (this.h / 2) + this.y, Math.max(this.w, this.h));

        if (this.isHighlighted) {
            // light blue
            gradient.addColorStop(0, '#2985E2');
            // dark blue
            gradient.addColorStop(1, '#0300F9');
            ctx.strokeStyle = "#0500A7";
        }
        else {
            // light green
            gradient.addColorStop(0, '#46EE3A');
            // dark green
            gradient.addColorStop(1, '#195508');
            ctx.strokeStyle = "#1A5A0F";
        }

        // Draw shape
        ctx.beginPath();
        ctx.moveTo(this.x + this.#radius, this.y);
        ctx.lineTo(this.x + this.w - this.#radius, this.y);
        ctx.quadraticCurveTo(this.x + this.w, this.y, this.x + this.w, this.y + this.#radius);
        ctx.lineTo(this.x + this.w, this.y + this.h - this.#radius);
        ctx.quadraticCurveTo(this.x + this.w, this.y + this.h, this.x + this.w - this.#radius, this.y + this.h);
        ctx.lineTo(this.x + this.#radius, this.y + this.h);
        ctx.quadraticCurveTo(this.x, this.y + this.h, this.x, this.y + this.h - this.#radius);
        ctx.lineTo(this.x, this.y + this.#radius);
        ctx.quadraticCurveTo(this.x, this.y, this.x + this.#radius, this.y);
        ctx.closePath();

        // Draw outline around path (rounded rectangle)
        ctx.lineWidth = this.#lineWidth;
        ctx.stroke();

        // Fill with gradient
        ctx.fillStyle = gradient;
        ctx.fill();

        // Write text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = this.font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (this.text2) {
            ctx.fillText(this.text, this.x + (this.w / 2), this.y + (this.h / 2) - 10);
            ctx.fillText(this.text2, this.x + (this.w / 2), this.y + (this.h / 2) + 10);
        }
        else
            ctx.fillText(this.text, this.x + (this.w / 2), this.y + (this.h / 2));

        if (this.isHighlighted)
            ctx.drawImage(dozerImage, this.x + 5, this.y + ((this.h - TILE_SIZE) / 2));
    }
}

class CyclingButton extends Button {
    constructor(x, y, w, h, isHighlighted, text, text2, font, action, textArray) {
        super(this, x, y, w, h, isHighlighted, text, text2, font, action);
        this.textArray = textArray;
        this.index = 0;
        this.text2 = this.textArray[this.index];
    }
}

class Menu {
    #ctx;

    constructor(c) {
        this.#ctx = c;
    }

    handleInput() {

    }
}

export { Button, CyclingButton, Menu }