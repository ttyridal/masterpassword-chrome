#!/bin/sh

mkdir -p ../ext/icons

for sizes in 16 19 32 48 128; do 
    convert -background transparent icon.svg -resize ${sizes}x${sizes} ../ext/icons/icon${sizes}.png
done

sizes=32
for files in "exit" "gear" "delete" "wrench" "burger"; do
    convert -background transparent ${files}.svg -resize ${sizes}x${sizes} ../ext/icons/${files}.png
done
