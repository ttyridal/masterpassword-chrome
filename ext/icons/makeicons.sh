#!/bin/sh
for sizes in 16 19 48 128; do 
    convert -background transparent icon.svg -resize ${sizes}x${sizes} icon${sizes}.png
done
