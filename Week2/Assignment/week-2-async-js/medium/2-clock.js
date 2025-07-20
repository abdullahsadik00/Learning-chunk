

// let date = new Date()
// console.log(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds())

function Time(format) {

    setInterval(() => {
        let date = new Date()
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        let ampm = ''
        if (format) {
            ampm = hours <= 12 ? 'AM' : 'PM'
            hours = hours % 12 || 12
        }
        console.log(`${hours}:${minutes}:${seconds} ${ampm}`);
    }, 1000)
}

Time(false)