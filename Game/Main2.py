from machine import Pin
from utime import sleep_ms

pins = [
    Pin(16, Pin.IN, Pin.PULL_DOWN), #Pin0
    Pin(17, Pin.IN, Pin.PULL_DOWN), #Pin1
    Pin(18, Pin.IN, Pin.PULL_DOWN), #Pin2
    Pin(19, Pin.IN, Pin.PULL_DOWN), #Pin3
    Pin(25, Pin.IN, Pin.PULL_DOWN), #Pin4
    Pin(26, Pin.IN, Pin.PULL_DOWN), #Pin5
    Pin(32, Pin.IN, Pin.PULL_DOWN), #Pin6
    Pin(33, Pin.IN, Pin.PULL_DOWN), #Pin7
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