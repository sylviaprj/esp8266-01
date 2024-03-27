// tests go here; this will not be compiled when this package is used as an extension.

ESP8266_01.connectWifi(
    SerialPin.P0,
    SerialPin.P1,
    BaudRate.BaudRate115200,
    "your_ssid",
    "your_pw"
)
loops.everyInterval(15000, function () {
    ESP8266_01.uploadThingspeak(
        "api_key",
        0
    )
})
loops.everyInterval(60000, function () {
    if (ESP8266_01.isWifiConnected()) {
        basic.showLeds(`
            . . . . .
            . # . # .
            . . . . .
            # . . . #
            . # # # .
            `)
        basic.pause(2000)
    } else {
        basic.showLeds(`
            . . . . .
            . # . # .
            . . . . .
            . # # # .
            # . . . #
            `)
        basic.pause(2000)
    }
    basic.clearScreen()
})
