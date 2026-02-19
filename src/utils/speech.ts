/**
 * Speaks a confirmation message using the Web Speech Synthesis API.
 * Uses Spanish (es-PE) voice if available.
 */
export const speakConfirmation = (message: string): void => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'es-PE';
    utterance.rate = 1.1;  // Slightly faster for UI feedback
    utterance.pitch = 1.0;

    // Pick a Spanish voice if available
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) utterance.voice = spanishVoice;

    window.speechSynthesis.speak(utterance);
};
