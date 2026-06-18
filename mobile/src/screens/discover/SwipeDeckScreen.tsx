import { useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Image, PanResponder, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { LIKED_EVENT_IDS, MOCK_EVENTS, getEventById, getGroupById } from '../../data';
import type { EventItem } from '../../data';
import { colors, radii, spacing, typography } from '../../theme';
import { formatEventDate, formatEventTime, formatPrice } from '../../utils/format';
import type { AppStackParamList, SwipeContext } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'SwipeDeck'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const CARD_HEIGHT = 440;

function getDeckEvents(context: SwipeContext): EventItem[] {
  if (context.type === 'group') {
    const group = getGroupById(context.id);
    if (!group) return [];
    return group.eventIds.map((id) => getEventById(id)).filter((event): event is EventItem => Boolean(event));
  }

  return MOCK_EVENTS.filter((event) => !LIKED_EVENT_IDS.includes(event.id));
}

export function SwipeDeckScreen({ route, navigation }: Props) {
  const { context } = route.params;
  const events = useMemo(() => getDeckEvents(context), [context]);
  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  const resetPosition = () => {
    Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
  };

  const onSwipeComplete = () => {
    position.setValue({ x: 0, y: 0 });
    setIndex((prev) => prev + 1);
  };

  const forceSwipe = (direction: 'left' | 'right') => {
    Animated.timing(position, {
      toValue: { x: direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5, y: 0 },
      duration: 220,
      useNativeDriver: false,
    }).start(onSwipeComplete);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6,
      onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      },
    }),
  ).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [20, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const subtitle =
    context.type === 'group'
      ? `Picks for ${context.label}`
      : context.type === 'user'
        ? `${context.label}'s picks`
        : 'Picks for you';

  const current = events[index];
  const next = events[index + 1];

  return (
    <ScreenContainer scroll={false}>
      <View>
        <Text style={styles.title}>Swipe</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.deck}>
        {!current ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptyBody}>Check back later for new recommendations.</Text>
            <AppButton label="Back" onPress={() => navigation.goBack()} variant="outline" />
          </View>
        ) : (
          <>
            {next ? (
              <View style={[styles.card, styles.cardBehind]}>
                <SwipeCardContent event={next} />
              </View>
            ) : null}
            <Animated.View
              style={[styles.card, { transform: [...position.getTranslateTransform(), { rotate }] }]}
              {...panResponder.panHandlers}
            >
              <SwipeCardContent event={current} />
              <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
                <Text style={styles.stampLikeText}>LIKE</Text>
              </Animated.View>
              <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
                <Text style={styles.stampNopeText}>PASS</Text>
              </Animated.View>
            </Animated.View>
          </>
        )}
      </View>

      {current ? (
        <>
          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <AppButton label="Pass" onPress={() => forceSwipe('left')} variant="outline" icon="close" />
            </View>
            <View style={styles.actionButton}>
              <AppButton label="Like" onPress={() => forceSwipe('right')} variant="accent" icon="heart" />
            </View>
          </View>
          <AppButton
            label="View details"
            onPress={() => navigation.navigate('EventDetail', { eventId: current.id })}
            variant="ghost"
          />
        </>
      ) : null}
    </ScreenContainer>
  );
}

function SwipeCardContent({ event }: { event: EventItem }) {
  const time = formatEventTime(event);

  return (
    <>
      {event.image_url ? (
        <Image source={{ uri: event.image_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.overlay}>
        <Text style={styles.overlayTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.overlayMeta}>
          {formatEventDate(event)}
          {time ? ` · ${time}` : ''}
        </Text>
        {event.venue.name ? <Text style={styles.overlayMeta}>{event.venue.name}</Text> : null}
        <View style={styles.overlayBadge}>
          <Text style={styles.overlayBadgeText}>{formatPrice(event)}</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  deck: { flex: 1, justifyContent: 'center' },
  card: {
    position: 'absolute',
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardBehind: { top: 12, transform: [{ scale: 0.96 }] },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { backgroundColor: colors.surface },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    gap: spacing.xs,
    backgroundColor: 'rgba(22, 24, 29, 0.55)',
  },
  overlayTitle: { ...typography.title, color: '#FFFFFF' },
  overlayMeta: { ...typography.caption, color: '#FFFFFF' },
  overlayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  overlayBadgeText: { ...typography.label, color: '#FFFFFF' },
  stamp: {
    position: 'absolute',
    top: spacing.xl,
    borderWidth: 3,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  stampLike: { left: spacing.lg, borderColor: colors.accent, transform: [{ rotate: '-12deg' }] },
  stampLikeText: { ...typography.title, color: colors.accent },
  stampNope: { right: spacing.lg, borderColor: colors.textMuted, transform: [{ rotate: '12deg' }] },
  stampNopeText: { ...typography.title, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionButton: { flex: 1 },
  empty: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  emptyTitle: { ...typography.heading, color: colors.text },
  emptyBody: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
