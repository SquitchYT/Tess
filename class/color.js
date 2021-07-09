class Color{
    constructor(color, alpha) {
        this.color = color;
        this.alpha = alpha;
    }

    get rgb() {
        return this.ToRgb();
    }

    get rgba() {
        return this.ToRgba();
    }

    ToRgb() {
        let r,g,b = 0;
        if (this.color.length == 4) {
            r = "0x" + this.color[1] + this.color[1];
            g = "0x" + this.color[2] + this.color[2];
            b = "0x" + this.color[3] + this.color[3];
        } else if (this.color.length == 7) {
            r = "0x" + this.color[1] + this.color[2];
            g = "0x" + this.color[3] + this.color[4];
            b = "0x" + this.color[5] + this.color[6];
        }
        return "rgb(" + +r + "," + +g + "," + +b + ")";
    }

    ToRgba() {
        let r,g,b = 0;
        let a = this.alpha;
        if (this.color.length == 4) {
            r = "0x" + this.color[1] + this.color[1];
            g = "0x" + this.color[2] + this.color[2];
            b = "0x" + this.color[3] + this.color[3];
        } else if (this.color.length == 7) {
            r = "0x" + this.color[1] + this.color[2];
            g = "0x" + this.color[3] + this.color[4];
            b = "0x" + this.color[5] + this.color[6];
        } else if (this.color.length == 9){
            r = "0x" + this.color[1] + this.color[2];
            g = "0x" + this.color[3] + this.color[4];
            b = "0x" + this.color[5] + this.color[6];
            a = "0x" + this.color[7] + this.color[8];
        }
        return "rgba(" + +r + "," + +g + "," + +b + "," + +a +")";
    }
}

module.exports = Color;