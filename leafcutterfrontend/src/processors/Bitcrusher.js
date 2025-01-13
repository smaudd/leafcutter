class BitcrusherProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "bitDepth",
        defaultValue: 16,
        minValue: 1,
        maxValue: 16,
      },
    ];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (input.length > 0) {
      const inputChannel = input[0];
      const outputChannel = output[0];
      const bitDepth = parameters.bitDepth[0];
      const step = Math.pow(2, 16 - bitDepth);

      for (let i = 0; i < inputChannel.length; i++) {
        outputChannel[i] = Math.round(inputChannel[i] * step) / step;
      }
    }

    return true; // Keep the processor alive
  }
}

registerProcessor("bitcrusher-processor", BitcrusherProcessor);
