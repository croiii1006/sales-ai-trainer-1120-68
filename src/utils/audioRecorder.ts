export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      }
    });

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    this.audioChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
  }

  async stop(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("MediaRecorder not initialized"));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
          const base64Audio = await this.blobToBase64(audioBlob);

          if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
          }

          resolve(base64Audio);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // 移除 data:audio/webm;base64, 前缀，只保留纯 base64 数据
        const base64Data = base64.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }
}

export async function transcribeAudio(base64Audio: string): Promise<string> {
  try {
    // base64Audio 此时已经是不带 data: 前缀的纯 base64 字符串，
    // 如果未来改动了 AudioRecorder 返回值，这里做一次兜底处理：
    const pureBase64 = base64Audio.includes(",")
      ? base64Audio.split(",")[1]
      : base64Audio;

    const response = await fetch("http://127.0.0.1:8000/api/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audioBase64: pureBase64,
      }),
    });

    if (!response.ok) {
      console.error(
        "Whisper API 调用失败",
        response.status,
        await response.text()
      );
      throw new Error("Whisper API 调用失败");
    }

    const data = await response.json();
    // 后端返回结构为 { "text": "识别结果" }
    return data.text ?? "";
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}
