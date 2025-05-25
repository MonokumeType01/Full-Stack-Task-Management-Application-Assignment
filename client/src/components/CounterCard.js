export default function CounterCard({ num, title }) {

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-4xl font-bold text-blue-600">{num}</p>
    </div>
  );
}
