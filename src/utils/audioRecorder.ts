export async function transcribeAudio(base64Audio: string): Promise<string> {
  try {
    const pureBase64 = base64Audio.includes(",") ? base64Audio.split(",")[1] : base64Audio;

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
      console.error("Whisper API 调用失败", response.status, await response.text());
      throw new Error("Whisper API 调用失败");
    }

    const data = await response.json();
    return data.text ?? "";
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}
