from machine import Pin
from utime import sleep_ms

pins = [
    Pin(16, Pin.IN, Pin.PULL_DOWN), #Pin0
    Pin(17, Pin.IN, Pin.PULL_DOWN), #Pin1
    Pin(18, Pin.IN, Pin.PULL_DOWN), #Pin2
    Pin(21, Pin.IN, Pin.PULL_DOWN), #Pin3
    Pin(22, Pin.IN, Pin.PULL_DOWN), #Pin4
    Pin(23, Pin.IN, Pin.PULL_DOWN), #Pin5
]

Gameactive = True

hits = [False] * len(pins)

while Gameactive:
    for i, pin in enumerate(pins):
        if pin.value() == 1:
            if not hits[i]:
                print(i)
                sleep_ms(3)
            hits[i] = True
        else:
            hits[i] = False
    sleep_ms(10)