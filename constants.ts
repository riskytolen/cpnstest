import type { QuestionCategory } from './types';

export const MODEL_NAME = 'gemini-2.5-flash';

export const SKB_FIELDS: string[] = [
  'Pranata Komputer',
  'Dokter Umum',
  'Perawat',
  'Bidan',
  'Apoteker',
  'Guru Matematika (Ahli Pertama)',
  'Guru Bahasa Inggris (Ahli Pertama)',
  'Guru Kelas (Ahli Pertama)',
  'Analis Kebijakan',
  'Analis Anggaran',
  'Auditor',
  'Perencana',
  'Hukum dan HAM',
  'Teknik Sipil (PUPR)',
  'Arsitek',
  'Statistisi',
  'Psikolog Klinis',
  'Pekerja Sosial',
];


export const getSystemInstruction = (category: QuestionCategory): string => {
  const baseInstruction = `
    Anda adalah seorang ahli pembuat soal ujian CPNS di Indonesia.
    Tugas Anda adalah membuat satu soal pilihan ganda yang relevan dan berkualitas tinggi.
    Setiap soal harus mengikuti format JSON yang telah ditentukan.
    Pastikan jawaban yang benar adalah salah satu dari 4 opsi yang diberikan.
    Berikan penjelasan yang singkat, padat, dan jelas mengapa jawaban tersebut benar.
    Jangan ulangi soal yang sudah pernah Anda berikan. Buatlah soal yang bervariasi setiap saat.
  `;

  if (category.startsWith('SKB - ')) {
    const field = category.replace('SKB - ', '');
    return `
      ${baseInstruction}
      Fokus soal adalah pada Seleksi Kompetensi Bidang (SKB) untuk formasi ${field}.
      Buatlah soal berupa studi kasus atau skenario praktis yang relevan dengan pekerjaan ASN di bidang ${field}.
      Materi soal harus mencakup salah satu dari topik mendalam yang spesifik untuk bidang ${field} (misalnya, terminologi teknis, prosedur standar, studi kasus, atau peraturan terkait).
      Soal harus menantang dan relevan dengan dunia kerja PNS di bidang ${field}.
    `;
  }

  switch (category) {
    case 'TWK':
      return `
        ${baseInstruction}
        Fokus soal adalah pada Tes Wawasan Kebangsaan (TWK).
        Materi soal harus mencakup salah satu dari topik berikut: Nasionalisme, Integritas, Bela Negara, Pilar Negara (Pancasila, UUD 1945, Bhinneka Tunggal Ika, NKRI), atau Bahasa Indonesia.
        Buatlah soal yang menguji pemahaman dan implementasi nilai-nilai kebangsaan.
      `;
    case 'TIU':
      return `
        ${baseInstruction}
        Fokus soal adalah pada Tes Intelegensi Umum (TIU).
        Materi soal harus menguji salah satu dari kemampuan berikut:
        1. Kemampuan Verbal: sinonim, antonim, analogi, atau penalaran analitis.
        2. Kemampuan Numerik: deret angka, aritmatika, perbandingan kuantitatif, atau soal cerita.
        3. Kemampuan Figural: analogi gambar, ketidaksamaan gambar, atau serial gambar.
        Pastikan soalnya logis dan memiliki satu jawaban pasti.
      `;
    case 'TKP':
      return `
        ${baseInstruction}
        Fokus soal adalah pada Tes Karakteristik Pribadi (TKP).
        Buatlah soal berupa studi kasus (skenario) singkat yang relevan dengan tugas sebagai ASN.
        Opsi jawaban harus berupa tindakan yang bisa diambil. Tidak ada jawaban yang salah mutlak, tetapi ada satu jawaban yang paling tepat dan menunjukkan skor tertinggi sesuai dengan nilai-nilai ASN.
        Materi harus mencakup salah satu aspek berikut: Pelayanan Publik, Jejaring Kerja, Sosial Budaya, Teknologi Informasi dan Komunikasi, Profesionalisme, atau Anti Radikalisme.
        Penjelasan harus menguraikan mengapa opsi yang benar adalah yang paling ideal.
      `;
    default:
      // Fallback for 'Umum' if it ever gets passed, though UI should prevent this.
      return `
        ${baseInstruction}
        Fokus soal adalah pada materi ujian CPNS umum, yang mencakup Tes Wawasan Kebangsaan (TWK), Tes Intelegensi Umum (TIU), atau Tes Karakteristik Pribadi (TKP).
      `;
  }
};
