import { apiUrl, getToken } from "./client";

/**
 * 음성 인식(STT) - 번역 화면 마이크 버튼 / 음성 파일 업로드 공용.
 *
 * client.js 의 공통 request() 를 못 쓴다 - request() 는 항상
 * Content-Type: application/json 을 강제로 붙이는데, 오디오는
 * multipart/form-data 로 보내야 해서 브라우저가 boundary 를 포함해
 * Content-Type 을 직접 정하게 둬야 한다(헤더를 명시하면 boundary 가 빠져 깨진다).
 *
 * blob: 녹음된 오디오(Blob) 또는 업로드된 오디오 파일(File). 실패하거나
 * 인식된 텍스트가 없으면 에러를 던진다 - 번역할 텍스트가 없는 채로 조용히
 * 넘어가면 사용자가 원인을 알 수 없다.
 *
 * filename: 서버(Whisper)가 확장자로 오디오 포맷을 판단해서 정확한 파일명이
 * 필요하다. 업로드 파일은 File 객체 자신의 이름을 넘기면 되고, 마이크
 * 녹음은 파일이 아니라 Blob 이라 이름이 없어서 기본값을 쓴다.
 */
export async function transcribeAudio(blob, filename = "recording.webm") {
  const formData = new FormData();
  formData.append("audio", blob, filename);

  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(apiUrl("/api/stt/transcribe"), {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const error = new Error(data?.message ?? `음성 인식에 실패했습니다. (${res.status})`);
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  if (!data.text) {
    throw new Error("음성을 인식하지 못했습니다. 다시 말씀해 주세요.");
  }

  return data.text;
}
