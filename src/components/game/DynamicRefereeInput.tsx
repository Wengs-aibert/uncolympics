import type { Team, Player } from '../../types';

interface RefereeInputDef {
  key: string;
  label: string;
  type: 'team_select' | 'player_select' | 'team_scores' | 'player_times';
}

interface Props {
  inputs: RefereeInputDef[];
  teams: Team[];
  players: Player[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

function DynamicRefereeInput({ inputs, teams, players, values, onChange }: Props) {
  const handleNumberChange = (key: string, value: string, subKey?: string) => {
    const numValue = parseFloat(value) || 0;
    if (subKey) {
      onChange(key, { ...values[key], [subKey]: numValue });
    } else {
      onChange(key, numValue);
    }
  };

  return (
    <div className="space-y-8">
      {inputs.map((input) => (
        <div key={input.key} className="text-center">
          <label className="block text-lg font-medium text-gray-300 mb-4">
            {input.label}
          </label>

          {input.type === 'team_select' && (
            <div className="flex flex-col space-y-3">
              {teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => onChange(input.key, team.id)}
                  className={`px-6 py-4 rounded-lg text-lg font-semibold transition-colors ${
                    values[input.key] === team.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {team.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onChange(input.key, null)}
                className={`px-6 py-4 rounded-lg text-lg font-semibold transition-colors ${
                  values[input.key] === null
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Tie / No Winner
              </button>
            </div>
          )}

          {input.type === 'player_select' && (
            <select
              value={values[input.key] || ''}
              onChange={(e) => onChange(input.key, e.target.value || null)}
              className="w-full px-4 py-3 text-lg bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a player...</option>
              {players
                .filter(p => p.role === 'player')
                .map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
            </select>
          )}

          {input.type === 'team_scores' && (
            <div className="space-y-4">
              {teams.map((team) => (
                <div key={team.id} className="flex items-center justify-between">
                  <span className="text-lg text-gray-300">{team.name}</span>
                  <input
                    type="number"
                    value={values[input.key]?.[team.id] || 0}
                    onChange={(e) => handleNumberChange(input.key, e.target.value, team.id)}
                    min="0"
                    step="0.1"
                    className="w-20 px-3 py-2 text-lg bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                </div>
              ))}
            </div>
          )}

          {input.type === 'player_times' && (
            <div className="space-y-4">
              {players
                .filter(p => p.role === 'player')
                .map((player) => (
                  <div key={player.id} className="flex items-center justify-between">
                    <span className="text-lg text-gray-300">{player.name}</span>
                    <input
                      type="number"
                      value={values[input.key]?.[player.id] || 0}
                      onChange={(e) => handleNumberChange(input.key, e.target.value, player.id)}
                      min="0"
                      step="0.01"
                      className="w-24 px-3 py-2 text-lg bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default DynamicRefereeInput;