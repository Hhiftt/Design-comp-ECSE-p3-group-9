from machine import Pin
from utime import sleep_ms

pin1 = Pin(16, Pin.IN, Pin.PULL_DOWN)
pin2 = Pin(17, Pin.IN, Pin.PULL_DOWN)
pin3 = Pin(18, Pin.IN, Pin.PULL_DOWN)
pin4 = Pin(19, Pin.IN, Pin.PULL_DOWN)

boolean1 = Gameactive = False

boolean1 = pin1hit = False
boolean2 = pin2hit = False
boolean3 = pin3hit = False
boolean4 = pin4hit = False


while Gameactive == True:
    if pin1.value() == 1:
        print("Target 1 Hit")
        pin1hit = True
        sleep_ms(100)
    else:
        print("Target 1 Not Hit")
        pin1hit = False

    if pin2.value() == 1:
        print("Target 2 Hit")
        pin2hit = True
        sleep_ms(100)
    else:
        print("Target 2 Not Hit")
        pin2hit = False

    if pin3.value() == 1:
        print("Target 3 Hit")
        pin3hit = True
        sleep_ms(100)
    else:
        print("Target 3 Not Hit")
        pin3hit = False

    if pin4.value() == 1:
        print("Target 4 Hit")
        pin4hit = True
        sleep_ms(100)
    else:
        print("Target 4 Not Hit")
        pin4hit = False