import { resolveAttack, resolveDamage, type RandomSource, type ResistanceMode } from "@/lib/dice";
import type { Creature } from "@/lib/schemas/creature";
import type { Combatant, Encounter } from "@/lib/schemas/encounter";

type RunEncounterRoundInput = {
  readonly encounter: Encounter;
  readonly creatures: readonly Creature[];
  readonly selectedCombatantIds: readonly string[];
  readonly actionByCombatantId: Readonly<Record<string, string>>;
  readonly targetAcEnabled: boolean;
  readonly targetAc: number;
  readonly damageMode: ResistanceMode;
  readonly random?: RandomSource;
};

function createLogId(index: number) {
  return `log-${Date.now()}-${index}`;
}

export function applyDamageToCombatant(combatant: Combatant, damage: number): Combatant {
  const currentTempHp = combatant.tempHp ?? 0;
  const absorbedByTemp = Math.min(currentTempHp, damage);
  const remainingDamage = damage - absorbedByTemp;

  return {
    ...combatant,
    tempHp: currentTempHp - absorbedByTemp,
    currentHp: Math.max(0, combatant.currentHp - remainingDamage),
  };
}

export function runEncounterRound({
  encounter,
  creatures,
  selectedCombatantIds,
  actionByCombatantId,
  targetAcEnabled,
  targetAc,
  damageMode,
  random,
}: RunEncounterRoundInput): Encounter {
  const creatureById = new Map(creatures.map((creature) => [creature.id, creature]));
  const selectedIds = new Set(selectedCombatantIds);
  const log = [...encounter.log];
  let logIndex = 0;

  for (const combatant of encounter.combatants) {
    if (!selectedIds.has(combatant.id) || !combatant.isActive || combatant.currentHp <= 0) {
      continue;
    }

    const creature = creatureById.get(combatant.creatureId);
    const actionName = actionByCombatantId[combatant.id];
    const action =
      creature?.actions.find((candidate) => candidate.name === actionName) ??
      creature?.actions.find((candidate) => candidate.attackBonus !== undefined && candidate.damage?.[0]);

    if (!creature || !action || action.attackBonus === undefined) {
      continue;
    }

    const attackRoll = resolveAttack({
      attackBonus: action.attackBonus,
      targetAc,
      random,
    });
    const damageDice = action.damage?.[0]?.dice;
    const damageType = action.damage?.[0]?.type ?? "damage";
    const shouldRollDamage = targetAcEnabled
      ? attackRoll.hit
      : !attackRoll.roll.isFumble;
    const critical = attackRoll.critical;
    const damage =
      shouldRollDamage && damageDice
        ? resolveDamage({
            dice: damageDice,
            critical,
            mode: damageMode,
            random,
          })
        : undefined;
    const outcome = targetAcEnabled
      ? critical
        ? "critical"
        : attackRoll.hit
          ? "hit"
          : "miss"
      : critical
        ? "critical"
        : attackRoll.roll.isFumble
          ? "fumble"
          : "roll";

    log.push({
      id: createLogId(logIndex),
      createdAt: new Date().toISOString(),
      attackerName: combatant.instanceName,
      targetName: "Target",
      actionName: action.name,
      outcome,
      toHit: {
        expression: "1d20",
        rolls: [...attackRoll.roll.rolls],
        modifier: attackRoll.roll.modifier,
        total: attackRoll.roll.total,
      },
      damage: damage
        ? {
            expression: damage.dice,
            rolls: [...damage.rolls],
            modifier: damage.modifier,
            rawTotal: damage.rawTotal,
            total: damage.total,
            mode: damage.mode,
            type: damageType,
          }
        : undefined,
    });
    logIndex += 1;
  }

  return {
    ...encounter,
    combatants: encounter.combatants,
    log,
    updatedAt: new Date().toISOString(),
  };
}
