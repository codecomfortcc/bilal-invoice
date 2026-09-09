pub fn number_to_words_indian(num: f64) -> String {
    let mut num = num.floor() as u64;
    if num == 0 {
        return "Zero Rupees Only".to_string();
    }

    let single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    let double = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    let tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    let format_tens = |n: u64| -> String {
        if n < 10 {
            single[n as usize].to_string()
        } else if n < 20 {
            double[(n - 10) as usize].to_string()
        } else {
            let mut s = tens[(n / 10) as usize].to_string();
            if n % 10 != 0 {
                s.push(' ');
                s.push_str(single[(n % 10) as usize]);
            }
            s
        }
    };

    let convert_group = |mut n: u64| -> String {
        let mut s = String::new();
        if n > 99 {
            s.push_str(single[(n / 100) as usize]);
            s.push_str(" Hundred ");
            n %= 100;
        }
        if n > 0 {
            s.push_str(&format_tens(n));
            s.push(' ');
        }
        s
    };

    let mut result = String::new();
    
    let crore = num / 10000000;
    num %= 10000000;
    
    let lakh = num / 100000;
    num %= 100000;
    
    let thousand = num / 1000;
    num %= 1000;
    
    let remainder = num;

    if crore > 0 {
        result.push_str(&convert_group(crore));
        result.push_str("Crore ");
    }
    if lakh > 0 {
        result.push_str(&convert_group(lakh));
        result.push_str("Lakh ");
    }
    if thousand > 0 {
        result.push_str(&convert_group(thousand));
        result.push_str("Thousand ");
    }
    if remainder > 0 {
        result.push_str(&convert_group(remainder));
    }

    format!("{} Rupees Only", result.trim())
}
