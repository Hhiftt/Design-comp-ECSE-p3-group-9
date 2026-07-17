from machine import Pin
from utime import sleep_ms

pin0 = Pin(16, Pin.IN, Pin.PULL_DOWN)
pin1 = Pin(17, Pin.IN, Pin.PULL_DOWN)
pin2 = Pin(18, Pin.IN, Pin.PULL_DOWN)
pin3 = Pin(19, Pin.IN, Pin.PULL_DOWN)

pin4 = Pin(25, Pin.OUT)
pin5 = Pin(26, Pin.OUT)
pin6 = Pin(32, Pin.OUT)
pin7 = Pin(33, Pin.OUT)

Gameactive = True

pin0hit = False
pin1hit = False
pin2hit = False
pin3hit = False

while Gameactive:

    if pin0.value() == 1:
        if not pin0hit:
            print(0)
            pin4.value(1)
            sleep_ms(100)
            pin4.value(0)
        pin0hit = True
    else:
        pin0hit = False

    if pin1.value() == 1:
        if not pin1hit:
            print(1)
            pin5.value(1)
            sleep_ms(100)
            pin5.value(0)
        pin1hit = True
    else:
        pin1hit = False

    if pin2.value() == 1:
        if not pin2hit:
            print(2)
            pin6.value(1)
            sleep_ms(100)
            pin6.value(0)
        pin2hit = True
    else:
        pin2hit = False

    if pin3.value() == 1:
        if not pin3hit:
            print(3)
            pin7.value(1)
            sleep_ms(100)
            pin7.value(0)
        pin3hit = True
    else:
        pin3hit = False
    sleep_ms(10)

