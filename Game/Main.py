from machine import Pin
from utime import sleep_ms
import network
import socket

# ==========================
# WIFI SETTINGS
# ==========================

SSID = "Vrishank’s iPhone"
PASSWORD = "123456789"

# ==========================
# INPUT PINS
# ==========================

pin1 = Pin(16, Pin.IN, Pin.PULL_DOWN)
pin2 = Pin(17, Pin.IN, Pin.PULL_DOWN)
pin3 = Pin(18, Pin.IN, Pin.PULL_DOWN)
pin4 = Pin(19, Pin.IN, Pin.PULL_DOWN)

# ==========================
# OUTPUT PINS
# ==========================

pin5 = Pin(25, Pin.OUT)
pin6 = Pin(26, Pin.OUT)
pin7 = Pin(32, Pin.OUT)
pin8 = Pin(33, Pin.OUT)

# ==========================
# CONNECT TO WIFI
# ==========================

print("Connecting to WiFi...")

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(SSID, PASSWORD)

while not wlan.isconnected():
    sleep_ms(500)

ip = wlan.ifconfig()[0]

print("Connected!")
print("ESP32 IP Address:", ip)

# ==========================
# WEB SERVER
# ==========================

game_active = False

html = """
<!DOCTYPE html>
<html>
<head>
<title>ESP32 Target Game</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family:Arial;text-align:center;margin-top:50px;">
<h1>ESP32 Target Game</h1>
<a href="/start">
<button style="font-size:32px;padding:20px;">
START GAME
</button>
</a>
</body>
</html>
"""

server = socket.socket()
server.bind(("0.0.0.0", 80))
server.listen(1)

print("")
print("Open this address in your browser:")
print("http://" + ip)
print("")

while not game_active:

    conn, addr = server.accept()

    request = conn.recv(1024)
    request = request.decode()

    if "GET /start" in request:
        game_active = True

    conn.send("HTTP/1.1 200 OK\r\n")
    conn.send("Content-Type: text/html\r\n")
    conn.send("Connection: close\r\n\r\n")
    conn.send(html)

    conn.close()

print("Game Started!")

# ==========================
# GAME VARIABLES
# ==========================

Gameactive = True

pin1hit = False
pin2hit = False
pin3hit = False
pin4hit = False

# ==========================
# MAIN GAME LOOP
# ==========================

while Gameactive:

    if pin1.value() == 1:
        print("Target 1 Hit")
        pin1hit = True

        pin5.value(1)
        sleep_ms(100)
        pin5.value(0)

    else:
        pin1hit = False

    if pin2.value() == 1:
        print("Target 2 Hit")
        pin2hit = True

        pin6.value(1)
        sleep_ms(100)
        pin6.value(0)

    else:
        pin2hit = False

    if pin3.value() == 1:
        print("Target 3 Hit")
        pin3hit = True

        pin7.value(1)
        sleep_ms(100)
        pin7.value(0)

    else:
        pin3hit = False

    if pin4.value() == 1:
        print("Target 4 Hit")
        pin4hit = True

        pin8.value(1)
        sleep_ms(100)
        pin8.value(0)

    else:
        pin4hit = False

    sleep_ms(10)

