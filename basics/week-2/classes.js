class Rectangle {
    constructor(width, height, color) {
        this.width = width;
        this.height = height;
        this.color = color;
    }

    area() {
        const area = this.width * this.height;
        return area;
    }

    paint() {
        console.log(`Painting with color ${this.color}`);
    }

}

const rect = new Rectangle(2, 4)
const area = rect.area();
console.log(area)

// Assignment #1 - Create a Circle class
class Circle {
    constructor(radius, color) {
        this.radius = radius;
        this.color = color
    }
    area() {
        const area = this.radius * this.radius * Math.PI;
        return area;
    }

    paint() {
        console.log(`Painting with color ${this.color}`);
    }
}