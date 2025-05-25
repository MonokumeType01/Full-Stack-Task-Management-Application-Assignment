export default function CounterCard({ title, num, maxNum }) {

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-4xl font-bold text-blue-600">{num} {maxNum && <span> / {maxNum}</span>}</p> 
    </div>
  );
}
