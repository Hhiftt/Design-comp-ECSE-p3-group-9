from machine import Pin
from utime import sleep_ms
import sys

pin1 = Pin(16, Pin.IN, Pin.PULL_DOWN)
pin2 = Pin(17, Pin.IN, Pin.PULL_DOWN)
pin3 = Pin(18, Pin.IN, Pin.PULL_DOWN)
pin4 = Pin(19, Pin.IN, Pin.PULL_DOWN)


Gameactive, pin1hit, pin2hit, pin3hit, pin4hit = False, False, False, False, False

user_input = input("Start Game? (y/n): ")
if user_input.lower() == "y":
    Gameactive = True
    print("Game Started")
else:
    print("Game Not Started")
    sys.exit()

while Gameactive == True:
    if pin1.value() == 1:
        print("Target 1 Hit")
        pin1hit = True
        sleep_ms(100)
    else:
        pin1hit = False

    if pin2.value() == 1:
        print("Target 2 Hit")
        pin2hit = True
        sleep_ms(100)
    else:
        pin2hit = False

    if pin3.value() == 1:
        print("Target 3 Hit")
        pin3hit = True
        sleep_ms(100)
    else:
        pin3hit = False

    if pin4.value() == 1:
        print("Target 4 Hit")
        pin4hit = True
        sleep_ms(100)
    else:
        pin4hit = False