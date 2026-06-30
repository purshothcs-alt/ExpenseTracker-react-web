import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { addNotification } from '@app/uiSlice';
import { useGetBudgetsQuery } from '@app/api/budgetsApi';
import { useGetGoalsQuery } from '@app/api/goalsApi';
import { useGetAccountsQuery } from '@app/api/accountsApi';
import { daysUntil } from '@core/utils/date';

type Severity = 'success' | 'error' | 'warning' | 'info';

/**
 * Watches budgets/goals/accounts and raises notifications for conditions
 * worth surfacing (over budget, goal reached, low balance, etc). Dedupes
 * against notifications currently in the panel so dismissing one doesn't
 * cause it to instantly reappear on the next data refetch.
 */
export function useNotificationGenerator() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((s) => s.ui.notifications);
  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;

  const { data: budgets = [] } = useGetBudgetsQuery();
  const { data: goals = [] } = useGetGoalsQuery();
  const { data: accounts = [] } = useGetAccountsQuery();

  useEffect(() => {
    const existing = new Set(notificationsRef.current.map((n) => n.message));
    const notify = (message: string, severity: Severity) => {
      if (!existing.has(message)) {
        existing.add(message);
        dispatch(addNotification({ message, severity }));
      }
    };

    for (const b of budgets) {
      const pct = b.utilizationPct || 0;
      if (pct >= 100) {
        notify(`Budget "${b.name}" is over limit (${pct.toFixed(0)}%)`, 'error');
      } else if (pct >= b.alertThreshold) {
        notify(`Budget "${b.name}" is near its limit (${pct.toFixed(0)}%)`, 'warning');
      }
    }

    for (const g of goals) {
      const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
      if (pct >= 100) {
        notify(`Goal "${g.goalName}" reached!`, 'success');
      } else if (g.targetDate) {
        const days = daysUntil(g.targetDate);
        if (days < 0) {
          notify(`Goal "${g.goalName}" is overdue`, 'error');
        } else if (days <= 7) {
          notify(
            `Goal "${g.goalName}" target date is in ${days} day${days === 1 ? '' : 's'}`,
            'warning',
          );
        }
      }
    }

    for (const a of accounts) {
      if (a.currentBalance < 0) {
        notify(`Account "${a.name}" balance is negative`, 'error');
      }
    }
  }, [budgets, goals, accounts, dispatch]);
}
