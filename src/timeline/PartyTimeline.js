import React, { useRef, useEffect, useMemo } from 'react';
import { DataSet, Timeline } from 'vis-timeline/standalone';

import { isJob, getJob, isCooldown, getCooldown } from '../data';

import './PartyTimeline.css';

function serialize(items) {
	const data = items.map(item => ({
		id: item.id,
		group: item.group,
		start: +item.start,
	}));
	return JSON.stringify(data);
}

function deserialize(json) {
	const data = JSON.parse(json);
	const items = data.map(item => ({
		id: item.id,
		group: item.group,
		start: new Date(item.start),
	}));

	for (let item of items) {
		initTimelineItem(item);
	}

	return items;
}

function save(items) {
	const data = items.get();
	const json = serialize(data);
	localStorage.setItem('data', json);
}

function load() {
	const items = new DataSet();

	const json = localStorage.getItem('data');
	if (json) {
		const data = deserialize(json);
		items.add(data);
	}

	return items;
}

function initTimelineItem(item) {
	const cooldown = getCooldown(item.group);

	item.className = item.group;
	item.end = item.start.getTime() + cooldown.recast;
	item.style = `--ratio: ${100 * cooldown.duration / cooldown.recast}%; --color: ${cooldown.color};`;

	return item;
}

function createJobTimelineGroup(job) {
	const jobItem = {
		treeLevel: 0,
		id: job.id,
		nestedGroups: job.cooldowns.map(cooldown => cooldown.id),  
	};
	const cooldownItems = job.cooldowns.map(cooldown => ({
		id: cooldown.id,
		treeLevel: 1,
	}));
	return [jobItem, ...cooldownItems];
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

		groupTemplate: function (item) {
			if (item) {
				if (isJob(item.id)) {
					const job = getJob(item.id);
					return job.name;
				} else if (isCooldown(item.id)) {
					const cooldown = getCooldown(item.id);
					return `<img src="/${cooldown.icon}"><span>${cooldown.name}</span>`;
				}
			}
			return '';
		},

		template: function (item) {
			const cooldown = getCooldown(item.group);
			return `<img src="/${cooldown.icon}">`;
		},

		onAdd: function (item, callback) {
			if (isCooldown(item.group)) {
				initTimelineItem(item);
				callback(item);
				save(items);
			}
		},

		onMoving: function (item, callback) {
			const overlapping = items.get({
				filter: function (testItem) {
					return (
						testItem.id !== item.id &&
						item.start <= testItem.end &&
						item.end >= testItem.start &&
						item.group === testItem.group
					);
				}
			});

			if (overlapping.length === 0 && item.start >= 0) {
				callback(item);
			}
		},

		onMove: function (item, callback) {
			callback(item);
			save(items);
		},

		onRemove: function (item, callback) {
			callback(item);
			save(items);
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

	const items = useMemo(() => load(), []);

	const container = useRef(null);

	useEffect(() => {
		if (container.current) {
			const options = getTimelineOptions(fight, items);
			const timeline = new Timeline(container.current, items, groups, options);

			for (const marker of fight.timeline) {
				timeline.addCustomTime(marker.start, marker.id);
				timeline.setCustomTimeMarker(marker.name, marker.id);
				timeline.setCustomTimeTitle(marker.title, marker.id);
			}

			return () => {
				timeline.destroy()
			};
		}
	}, [container, items, groups, fight]);

	return <div ref={container} />;
};
