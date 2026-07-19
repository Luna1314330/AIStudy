class XfyunPcmProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0]?.[0]
    if (channel?.length) {
      this.port.postMessage({
        samples: channel.slice(),
        sampleRate,
      })
    }
    return true
  }
}

registerProcessor('xfyun-pcm-processor', XfyunPcmProcessor)
