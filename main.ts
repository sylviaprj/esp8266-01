/**
 * MakeCode extension for ESP8266-01 Wifi modules 
 */
//% color=#F19509 icon="\uf1eb" block="ESP8266-01"
namespace ESP8266_01 {

    let wifi_connected: boolean = false

    // write AT command with CR+LF ending
    function sendAT(command: string, wait: number = 100) {
        serial.writeString(command + "\u000D\u000A")
        basic.pause(wait)
    }

    // wait for certain response from ESP8266-01
    function waitResponse(): boolean {
        let serial_str: string = ""
        let result: boolean = false
        let time: number = input.runningTime()
        while (true) {
            serial_str += serial.readString()
            if (serial_str.length > 200) serial_str = serial_str.substr(serial_str.length - 200)
            if (serial_str.includes("OK") || serial_str.includes("ALREADY CONNECTED")) {
                result = true
                break
            } else if (serial_str.includes("ERROR") || serial_str.includes("SEND FAIL")) {
                break
            }
            if (input.runningTime() - time > 30000) break
        }
        return result
    }

    /**
    * Initialize ESP8266 module and connect it to Wifi router
    */
    //% block="Initialize ESP8266|RX (Tx of micro:bit) %tx|TX (Rx of micro:bit) %rx|Baud rate %baudrate|Wifi SSID = %ssid|Wifi PW = %pw"
    //% tx.defl=SerialPin.P0
    //% rx.defl=SerialPin.P1
    //% ssid.defl=your_ssid
    //% pw.defl=your_pw
    export function connectWifi(tx: SerialPin, rx: SerialPin, baudrate: BaudRate, ssid: string, pw: string) {
        wifi_connected = false
        serial.redirect(
            tx,
            rx,
            baudrate
        )
        sendAT("AT+RESTORE", 1000) // restore to factory settings
        sendAT("AT+CWMODE=1") // set to STA mode
        sendAT("AT+RST", 1000) // reset
        sendAT("AT+CWJAP=\"" + ssid + "\",\"" + pw + "\"", 0) // connect to Wifi router
        wifi_connected = waitResponse()
        basic.pause(100)
    }

    /**
    * Check if ESP8266-01 successfully connected to Wifi
    */
    //% block="Wifi connected ?"
    export function isWifiConnected() {
        return wifi_connected
    }

    // Buffer for data received from UART.
    let rxData = ""

    /**
     * Send AT command and wait for response.
     * Return true if expected response is received.
     * @param command The AT command without the CRLF.
     * @param expected_response Wait for this response.
     * @param timeout Timeout in milliseconds.
     */
    //% blockHidden=true
    //% blockId=esp8266_send_command
    export function sendCommand(command: string, expected_response: string = null, timeout: number = 100): boolean {
        // Wait a while from previous command.
        basic.pause(10)

        // Flush the Rx buffer.
        serial.readString()
        rxData = ""

        // Send the command and end with "\r\n".
        serial.writeString(command + "\r\n")

        // Don't check if expected response is not specified.
        if (expected_response == null) {
            return true
        }

        // Wait and verify the response.
        let result = false
        let timestamp = input.runningTime()
        while (true) {
            // Timeout.
            if (input.runningTime() - timestamp > timeout) {
                result = false
                break
            }

            // Read until the end of the line.
            rxData += serial.readString()
            if (rxData.includes("\r\n")) {
                // Check if expected response received.
                if (rxData.slice(0, rxData.indexOf("\r\n")).includes(expected_response)) {
                    result = true
                    break
                }

                // If we expected "OK" but "ERROR" is received, do not wait for timeout.
                if (expected_response == "OK") {
                    if (rxData.slice(0, rxData.indexOf("\r\n")).includes("ERROR")) {
                        result = false
                        break
                    }
                }

                // Trim the Rx data before loop again.
                rxData = rxData.slice(rxData.indexOf("\r\n") + 2)
            }
        }

        return result
    }

    /**
     * Get the specific response from ESP8266-01.
     * Return the line start with the specific response.
     * @param command The specific response we want to get.
     * @param timeout Timeout in milliseconds.
     */
    //% blockHidden=true
    //% blockId=esp8266_get_response
    export function getResponse(response: string, timeout: number = 100): string {
        let responseLine = ""
        let timestamp = input.runningTime()
        while (true) {
            // Timeout.
            if (input.runningTime() - timestamp > timeout) {
                // Check if expected response received in case no CRLF received.
                if (rxData.includes(response)) {
                    responseLine = rxData
                }
                break
            }

            // Read until the end of the line.
            rxData += serial.readString()
            if (rxData.includes("\r\n")) {
                // Check if expected response received.
                if (rxData.slice(0, rxData.indexOf("\r\n")).includes(response)) {
                    responseLine = rxData.slice(0, rxData.indexOf("\r\n"))

                    // Trim the Rx data for next call.
                    rxData = rxData.slice(rxData.indexOf("\r\n") + 2)
                    break
                }

                // Trim the Rx data before loop again.
                rxData = rxData.slice(rxData.indexOf("\r\n") + 2)
            }
        }

        return responseLine
    }


}
