document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calculatorForm');
    const lineSelect = document.getElementById('line');
    const jalurInput = document.getElementById('jalur');
    
    const DATA_LINE = {
        "Line 4": { kode: "D", jalur_max: 2 },
        "Line 6": { kode: "F", jalur_max: 3 },
        "Line 7": { kode: "G", jalur_max: 3 },
        "Line 9": { kode: "i", jalur_max: 4 }
    };

    const TANGGAL_KHUSUS_X = [
        "01-31", "02-29", "03-31", "06-29", "06-30", "08-31", "10-31"
    ]; 

    lineSelect.addEventListener('change', () => {
        const line = lineSelect.value;
        if (line) {
            jalurInput.max = DATA_LINE[line].jalur_max;
            jalurInput.placeholder = `Masukkan Jalur (1-${DATA_LINE[line].jalur_max})`;
            if (jalurInput.value > DATA_LINE[line].jalur_max) {
                 jalurInput.value = '';
            }
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const line = lineSelect.value;
        const shift = document.getElementById('shift').value;
        const jalur = parseInt(jalurInput.value);
        const group = document.getElementById('group').value;
        const prodDateStr = document.getElementById('prod_date').value;
        const expiredBulan = parseInt(document.getElementById('expired_bulan').value);

        if (!line || !shift || !jalur || !group || !prodDateStr) {
             alert("Mohon lengkapi semua kolom input.");
             return;
        }

        if (jalur < 1 || jalur > DATA_LINE[line].jalur_max) {
            alert(`Jalur Packing tidak valid untuk ${line}. Maksimal: ${DATA_LINE[line].jalur_max}`);
            return;
        }

        const { tanggalBB, kodeX } = calculateBestBefore(prodDateStr, expiredBulan);
        
        const hasilKode = generateCode(line, shift, jalur, group, tanggalBB, kodeX);

        document.getElementById('kode_bag_cup').innerText = hasilKode.bag_cup;
        document.getElementById('kode_karton').innerText = hasilKode.karton;
        
        document.getElementById('result').style.display = 'block'; 
    });

    function calculateBestBefore(prodDateStr, expiredBulan) {
        let [year, month, day] = prodDateStr.split('-').map(Number);
        let prodDate = new Date(year, month - 1, day); 
        
        let kodeX = "";
        let tanggalBB = new Date(prodDate);

        const prodMonth = prodDate.getMonth() + 1;
        const prodDay = prodDate.getDate();
        const prodYear = prodDate.getFullYear();

        const pad = (num) => String(num).padStart(2, '0');
        const prodDateFormat = `${pad(prodMonth)}-${pad(prodDay)}`;
        
        if (expiredBulan === 12 && prodMonth === 2 && prodDay === 29) {
            kodeX = "X";
            tanggalBB.setFullYear(prodYear + 1, 2, 1);
            return { tanggalBB, kodeX };
        }

        tanggalBB.setMonth(tanggalBB.getMonth() + expiredBulan);
        
        if (expiredBulan === 8 && TANGGAL_KHUSUS_X.includes(prodDateFormat)) {
            kodeX = "X";
            
            let yearBB = tanggalBB.getFullYear();
            let monthBB = tanggalBB.getMonth();
            
            
            if (prodDateFormat === "02-29") {
                 monthBB += 1;
                 tanggalBB.setDate(1);
            } else if (prodDateFormat === "06-30") {
                tanggalBB.setDate(2);
            } else {
                tanggalBB.setDate(1);
            }
            
            tanggalBB.setFullYear(yearBB, monthBB, tanggalBB.getDate());
        }

        return { tanggalBB, kodeX };
    }

    function generateCode(line, shift, jalur, group, tanggalBB, kodeX) {
        const kodeLine = DATA_LINE[line].kode;
        
        const day = String(tanggalBB.getDate()).padStart(2, '0');
        const month = String(tanggalBB.getMonth() + 1).padStart(2, '0');
        const year = String(tanggalBB.getFullYear()).slice(-2);
        const ddmmyy = day + month + year;

        const J = jalur;
        const L = kodeLine;
        const S = shift;
        const G = group;

        const kodeBag = `${kodeX}${J}${L}${S}${G} ${ddmmyy}`;
        const outputBag = `BEST BEFORE\n${kodeBag}`;

        const kodeKarton = `${kodeX}${L}${S}${G} ${ddmmyy} HH:MM RRRR`;
        const outputKarton = `${kodeKarton}\n(untuk karton ada actual jam:menit & no.counter)`;

        return { bag_cup: outputBag, karton: outputKarton };
    }

});