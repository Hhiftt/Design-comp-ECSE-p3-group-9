from machine import Pin
from utime import sleep

pin1 = Pin(16, Pin.In)
pin2 = Pin(17, Pin.In)
pin3 = Pin(18, Pin.In)
pin4 = Pin(19, Pin.In)

boolean1 = Gameactive = False

boolean1 = pin1hit = False
boolean2 = pin2hit = False
boolean3 = pin3hit = False
boolean4 = pin4hit = False

while Gameactive == True:
    if pin1.value() == 1:
        print("Target 1 Hit")
        pin1hit = True
    else:
        print("Target 1 Not Hit")
    pin1hit = False

    if pin2.value() == 1:
        print("Target 2 Hit")
        pin2hit = True
    else:
        print("Target 2 Not Hit")
        pin2hit = False

    if pin3.value() == 1:
        print("Target 3 Hit")
        pin3hit = True
    else:
        print("Target 3 Not Hit")
        pin3hit = False

    if pin4.value() == 1:
        print("Target 4 Hit")
        pin4hit = True
    else:
        print("Target 4 Not Hit")
        pin4hit = False