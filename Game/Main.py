from machine import Pin
from utime import sleep_ms

pin0 = Pin(16, Pin.IN, Pin.PULL_DOWN)
pin1 = Pin(17, Pin.IN, Pin.PULL_DOWN)
pin2 = Pin(18, Pin.IN, Pin.PULL_DOWN)
pin3 = Pin(19, Pin.IN, Pin.PULL_DOWN)

pin4 = Pin(25, Pin.IN, Pin.PULL_DOWN)
pin5 = Pin(26, Pin.IN, Pin.PULL_DOWN)
pin6 = Pin(32, Pin.IN, Pin.PULL_DOWN)
pin7 = Pin(33, Pin.IN, Pin.PULL_DOWN)

Gameactive = True

pin0hit = False
pin1hit = False
pin2hit = False
pin3hit = False
pin4hit = False
pin5hit = False
pin6hit = False
pin7hit = False

while Gameactive:

    if pin0.value() == 1:
        if not pin0hit:
            print(0)
            sleep_ms(100)
        pin0hit = True
    else:
        pin0hit = False

    if pin1.value() == 1:
        if not pin1hit:
            print(1)
            sleep_ms(100)
        pin1hit = True
    else:
        pin1hit = False

    if pin2.value() == 1:
        if not pin2hit:
            print(2)
            sleep_ms(100)
        pin2hit = True
    else:
        pin2hit = False

    if pin3.value() == 1:
        if not pin3hit:
            print(3)
            sleep_ms(100)
        pin3hit = True
    else:
        pin3hit = False

    if pin4.value() == 1:
        if not pin4hit:
            print(4)
            sleep_ms(100)
        pin4hit = True
    else:
        pin4hit = False
    
    if pin5.value() == 1:
        if not pin5hit:
            print(5)
            sleep_ms(100)
        pin5hit = True
    else:
        pin5hit = False
    
    if pin6.value() == 1:
        if not pin6hit:
            print(6)
            sleep_ms(100)
        pin6hit = True
    else:
        pin6hit = False

    if pin7.value() == 1:
        if not pin7hit:
            print(7)
            sleep_ms(100)
        pin7hit = True
    else:
        pin7hit = False

