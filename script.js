document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calculatorForm');
    const lineSelect = document.getElementById('line');
    const jalurInput = document.getElementById('jalur');
    
    // --- Data Konstanta ---
    const DATA_LINE = {
        "Line 4": { kode: "D", jalur_max: 2 },
        "Line 6": { kode: "F", jalur_max: 3 },
        "Line 7": { kode: "G", jalur_max: 3 },
        "Line 9": { kode: "I", jalur_max: 4 }
    };

    // Tanggal yang memicu kode 'X' jika expired 8 bulan. Format: "mm-dd"
    const TANGGAL_KHUSUS_X = [
        "01-31", "02-29", "03-31", "06-29", "06-30", "08-31", "10-31"
    ]; 

    // --- Validasi Jalur Real-time ---
    lineSelect.addEventListener('change', () => {
        const line = lineSelect.value;
        if (line) {
            jalurInput.max = DATA_LINE[line].jalur_max;
            jalurInput.placeholder = `Masukkan Jalur (1-${DATA_LINE[line].jalur_max})`;
            // Reset nilai jalur jika melebihi batas baru
            if (jalurInput.value > DATA_LINE[line].jalur_max) {
                 jalurInput.value = '';
            }
        }
    });

    // --- FUNGSI UTAMA KALKULASI & SUBMIT (HANYA ADA SATU) ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const line = lineSelect.value;
        const shift = document.getElementById('shift').value;
        const jalur = parseInt(jalurInput.value);
        const group = document.getElementById('group').value;
        const prodDateStr = document.getElementById('prod_date').value;
        const expiredBulan = parseInt(document.getElementById('expired_bulan').value);

        // Validasi Awal Input
        if (!line || !shift || !jalur || !group || !prodDateStr) {
             alert("Mohon lengkapi semua kolom input.");
             return;
        }

        // Validasi Akhir Jalur
        if (jalur < 1 || jalur > DATA_LINE[line].jalur_max) {
            alert(`Jalur Packing tidak valid untuk ${line}. Maksimal: ${DATA_LINE[line].jalur_max}`);
            return;
        }

        // Jalankan Kalkulasi
        const { tanggalBB, kodeX } = calculateBestBefore(prodDateStr, expiredBulan);
        
        // Buat Kode Output
        const hasilKode = generateCode(line, shift, jalur, group, tanggalBB, kodeX);

        // Tampilkan Hasil (Logic untuk menampilkan hasil di sini)
        document.getElementById('kode_bag_cup').innerText = hasilKode.bag_cup;
        document.getElementById('kode_karton').innerText = hasilKode.karton;
        
        // BARIS BARU: Menampilkan wadah hasil yang sebelumnya disembunyikan oleh CSS
        document.getElementById('result').style.display = 'block'; 
    });

    // --- Logika Penentuan Tanggal dan Kode X ---
    function calculateBestBefore(prodDateStr, expiredBulan) {
        // Penanganan Tanggal Aman dari String (YYYY-MM-DD)
        let [year, month, day] = prodDateStr.split('-').map(Number);
        // Buat objek Date menggunakan waktu lokal (timezone-safe: bulan 0-indexed)
        let prodDate = new Date(year, month - 1, day); 
        
        let kodeX = "";
        let tanggalBB = new Date(prodDate); // Kloning tanggal produksi

        const prodMonth = prodDate.getMonth() + 1; // Bulan 1-12
        const prodDay = prodDate.getDate(); // Hari 1-31
        const prodYear = prodDate.getFullYear();

        // Helper untuk memformat mm-dd
        const pad = (num) => String(num).padStart(2, '0');
        const prodDateFormat = `${pad(prodMonth)}-${pad(prodDay)}`;
        
        // --- Cek Kasus 1: Expired 12 Bulan & 29 Februari (Tahun Kabisat) ---
        if (expiredBulan === 12 && prodMonth === 2 && prodDay === 29) {
            kodeX = "X";
            // BB adalah 1 Maret tahun berikutnya
            tanggalBB.setFullYear(prodYear + 1, 2, 1); // Bulan Maret = indeks 2
            return { tanggalBB, kodeX };
        }

        // --- Kasus Umum: Tambahkan Bulan Expired ---
        // Menambah bulan secara otomatis menangani overflow tahun
        tanggalBB.setMonth(tanggalBB.getMonth() + expiredBulan);
        
        // --- Cek Kasus 2: Expired 8 Bulan di Tanggal Khusus ---
        if (expiredBulan === 8 && TANGGAL_KHUSUS_X.includes(prodDateFormat)) {
            kodeX = "X";
            
            // Simpan bulan dan tahun BB yang sudah dihitung (+8 bulan)
            let yearBB = tanggalBB.getFullYear();
            let monthBB = tanggalBB.getMonth(); // Indeks bulan BB (+8 bulan)
            
            
            if (prodDateFormat === "02-29") {
                 // Aturan Khusus 29 Feb (8 bulan): Expired 1 November
                 monthBB += 1; // Pindah dari Oktober (indeks 9) ke November (indeks 10)
                 tanggalBB.setDate(1); // Tanggal 1
            } else if (prodDateFormat === "06-30") {
                 // 30 Juni -> BB Tanggal 2
                tanggalBB.setDate(2);
            } else {
                // Semua tanggal khusus lainnya -> BB Tanggal 1
                tanggalBB.setDate(1);
            }
            
            // Terapkan kembali bulan dan tahun BB yang sudah benar
            tanggalBB.setFullYear(yearBB, monthBB, tanggalBB.getDate());
        }

        return { tanggalBB, kodeX };
    }

    // --- Logika Pembentukan String Kode ---
    function generateCode(line, shift, jalur, group, tanggalBB, kodeX) {
        const kodeLine = DATA_LINE[line].kode;
        
        // Format Tanggal BB (DDMMYY)
        const day = String(tanggalBB.getDate()).padStart(2, '0');
        const month = String(tanggalBB.getMonth() + 1).padStart(2, '0');
        const year = String(tanggalBB.getFullYear()).slice(-2);
        const ddmmyy = day + month + year;

        // Komponen Kode
        const J = jalur;
        const L = kodeLine;
        const S = shift;
        const G = group;

        // A. Kode Bag/Cup (Format: [X] J L S G ddmmyy)
        const kodeBag = `${kodeX}${J}${L}${S}${G} ${ddmmyy}`;
        const outputBag = `BEST BEFORE\n${kodeBag}`;

        // B. Kode Karton (Format: [X] L S G ddmmyy HH:MM RRRR)
        const kodeKarton = `${kodeX}${L}${S}${G} ${ddmmyy} HH:MM RRRR`;
        const outputKarton = `${kodeKarton}\n(untuk karton ada actual jam:menit & no.counter)`;

        return { bag_cup: outputBag, karton: outputKarton };
    }

}); // Penutup document.addEventListener('DOMContentLoaded')