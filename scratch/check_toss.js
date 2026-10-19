async function check() {
  const res = await fetch('https://js.tosspayments.com/v1/payment');
  const code = await res.text();
  const idx = code.indexOf('successUrl');
  console.log(code.substring(idx - 100, idx + 200));
}
check();

