interface StatInputDef {
  key: string;
  label: string;
  type: 'number' | 'boolean';
  min?: number;
  max?: number;
}

interface Props {
  inputs: StatInputDef[];
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

function DynamicStatInput({ inputs, values, onChange }: Props) {
  const handleIncrement = (key: string, max?: number) => {
    const currentValue = values[key] || 0;
    const newValue = max !== undefined ? Math.min(currentValue + 1, max) : currentValue + 1;
    onChange(key, newValue);
  };

  const handleDecrement = (key: string, min?: number) => {
    const currentValue = values[key] || 0;
    const newValue = min !== undefined ? Math.max(currentValue - 1, min) : currentValue - 1;
    onChange(key, newValue);
  };

  const handleToggle = (key: string) => {
    const currentValue = values[key] || 0;
    onChange(key, currentValue === 1 ? 0 : 1);
  };

  return (
    <div className="space-y-6">
      {inputs.map((input) => (
        <div key={input.key} className="text-center">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            {input.label}
          </label>

          {input.type === 'number' ? (
            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={() => handleDecrement(input.key, input.min)}
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white text-xl font-bold transition-colors flex items-center justify-center shadow-lg"
                disabled={input.min !== undefined && (values[input.key] || 0) <= input.min}
              >
                −
              </button>
              
              <div className="text-3xl font-bold text-white min-w-[4rem]">
                {values[input.key] || 0}
              </div>
              
              <button
                type="button"
                onClick={() => handleIncrement(input.key, input.max)}
                className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-500 text-white text-xl font-bold transition-colors flex items-center justify-center shadow-lg"
                disabled={input.max !== undefined && (values[input.key] || 0) >= input.max}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleToggle(input.key)}
              className={`relative inline-flex h-12 w-24 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                (values[input.key] || 0) === 1
                  ? 'bg-green-600'
                  : 'bg-gray-600'
              }`}
            >
              <span className="sr-only">{input.label}</span>
              <span
                className={`pointer-events-none inline-block h-10 w-10 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                  (values[input.key] || 0) === 1 ? 'translate-x-12' : 'translate-x-0'
                }`}
              />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default DynamicStatInput;