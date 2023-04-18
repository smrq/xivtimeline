import React, { useRef, useEffect, useMemo } from 'react';
import { DataSet, Timeline } from 'vis-timeline/standalone';
import './PartyTimeline.css';

import { getCooldown } from '../data';

function createJobTimelineGroup(job) {
	const cooldownItems = job.cooldowns.map(cooldown => ({
		id: cooldown.id,
		treeLevel: 1,
		content: cooldown.name
	}));

	const jobItem = {
		id: job.id,
		treeLevel: 0,
		content: job.name,
		nestedGroups: cooldownItems.map(item => item.id),  
	};

	return [jobItem, ...cooldownItems];
}

function cooldownStyle(cooldown) {
	const ratio = cooldown.duration / cooldown.recast;
	return `background: linear-gradient(to right, var(--fg-color) 0 ${ratio*100}%, var(--bg-color) ${ratio*100}% 100%); border-color: var(--border-color);`;
}

function getTimelineOptions(fight, items) {
	return {
		showMajorLabels: false,
		showCurrentTime: false,
		format: {
			minorLabels: {
				second: 'mm:ss',
				minute: 'mm:ss',
			},
		},
		zoomMin: 60000,
		start: 0,
		end: 120000,
		min: 0,
		max: fight.duration,
		groupHeightMode: 'fixed',
		snap: null,
		stack: false,
		itemsAlwaysDraggable: true,
		editable: {
			add: true,
			remove: true,
			updateGroup: false,
			updateTime: true,
			overrideItems: true,
		},

		onAdd: function (item, callback) {
			const cooldown = getCooldown(item.group);

			item.className = item.group;
			item.content = '';
			item.end = item.start.getTime() + cooldown.recast;
			item.style = cooldownStyle(cooldown);

			callback(item);

			const data = items.get();
			localStorage.setItem('data', JSON.stringify(data));
		},

		onMoving: function (item, callback) {
			const overlapping = items.get({
				filter: function (testItem) {
					if (testItem.id === item.id) {
						return false;
					}
					return (
						item.start <= testItem.end &&
						item.end >= testItem.start &&
						item.group === testItem.group
					);
				},
			});

			if (overlapping.length === 0 && item.start >= 0) {
				callback(item);
			}
		},

		onMove: function (item, callback) {
			callback(item);

			const data = items.get();
			localStorage.setItem('data', JSON.stringify(data));
		},

		onRemove: function (item, callback) {
			callback(item);

			const data = items.get();
			localStorage.setItem('data', JSON.stringify(data));
		},
	};
}

export function PartyTimeline({ fight, jobs }) {
	const groups = useMemo(() => {
		const groups = new DataSet();
		for (const job of jobs) {
			groups.add(createJobTimelineGroup(job));
		}
		return groups;
	}, [jobs]);

	const items = new DataSet();
	if (localStorage.getItem('data')) {
		let data = JSON.parse(localStorage.getItem('data'));
		items.add(data);
	}

	const container = useRef(null);

	useEffect(() => {
		if (container.current) {
			const options = getTimelineOptions(fight, items);
			const timeline = new Timeline(container.current, items, groups, options);

			for (const marker of fight.timeline) {
				timeline.addCustomTime(marker.time, marker.id);
				timeline.setCustomTimeMarker(marker.short || marker.name, marker.id);
			}

			return () => {
				timeline.destroy()
			};
		}
	}, [container, items, groups, fight]);

	// return timeline
	return <div ref={container} />;
};
