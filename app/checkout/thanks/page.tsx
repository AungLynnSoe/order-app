import Link from 'next/link';

export default function ThanksPage() {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>ありがとうございました！</h1>
      <p>またお越しください。</p>
      <Link href="/">
        <button>戻る</button>
      </Link>
    </div>
  );
}