//There is a smart light bulb(which can be on and off)
function lightBulb(id) {
    return ctx.Entity(id, 'lightBulb', {isOn: false});
}
