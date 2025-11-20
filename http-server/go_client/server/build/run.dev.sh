#!/bin/bash

MAIN_DIR=$(cd $(dirname "$0");cd ..;pwd)
# echo $MAIN_DIR
FFMPEG_LIB=$MAIN_DIR/lib/ffmpeg_output
export CGO_CFLAGS="-I$FFMPEG_LIB/include"
export CGO_LDFLAGS="-L$FFMPEG_LIB/lib"
export PKG_CONFIG_PATH="$FFMPEG_LIB/lib/pkgconfig"
export LD_LIBRARY_PATH="$FFMPEG_LIB/lib:$LD_LIBRARY_PATH"  # 运行时库路径




# export AUDIO_PATH="/home/zdz/mnt/Documents/Try/Go/audio/source/assets"
export AUDIO_PATH="/home/zdz/Documents/Try/TTS/audio/assets/dubbing/wav"





go run .
