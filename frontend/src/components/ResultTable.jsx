import React, { useState } from 'react';
import { format } from 'date-fns';
import ClockPicker from './ClockPicker';
import {
  CalendarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const ResultTable = ({ events, jobId, onExport, onViewTimeline, onAddManualEvent, onDeleteEvent = null, onEditEvent = null }) => {
  const [sortField, setSortField] = useState('start');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterEvent, setFilterEvent] = useState('');
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedEvent, setEditedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    shipCargo: '',
    layoffTime: ''
  });

  if (!events || events.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 text-center border border-white/20">
        <DocumentTextIcon className="h-12 w-12 text-white/60 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          No Events Found
        </h3>
        <p className="text-white/80 mb-6">
          No port events were extracted from the document.
        </p>
        <button
          onClick={() => setShowAddEventForm(true)}
          className="inline-flex items-center px-6 py-3 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600 transition-all duration-300"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Manual Event
        </button>
      </div>
    );
  }

  // Check for validation warnings
  const hasWarning = events.some(event =>
    event.event === 'Document Validation Warning' ||
    event.severity === 'Warning'
  );

  if (hasWarning) {
    const warningEvent = events.find(event =>
      event.event === 'Document Validation Warning' ||
      event.severity === 'Warning'
    );

    return (
      <div className="space-y-6">
        {/* Warning Card */}
        <div className="bg-amber-500/20 backdrop-blur-lg rounded-3xl p-6 border border-amber-300/30">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-300 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-200 mb-2">
                Document Validation Warning
              </h3>
              <p className="text-amber-100 mb-4">
                {warningEvent.description}
              </p>
              {warningEvent.suggestion && (
                <div className="bg-white/10 rounded-lg p-3 border-l-4 border-amber-300">
                  <p className="text-sm text-amber-100">
                    <strong>Suggestion:</strong> {warningEvent.suggestion}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Requirements Information */}
        <div className="card bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">Required Document Format:</h4>
                    <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4" />
              <span>Event timestamps (start and/or end times)</span>
            </li>
            <li className="flex items-center space-x-2">
              <DocumentTextIcon className="h-4 w-4" />
              <span>Detailed event descriptions</span>
            </li>
                <li className="flex items-center space-x-2">
              <span className="h-4 w-4 inline-block" />
              <span>Duration calculations between events</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // Calculate duration in real-time for form preview
  const calculateDuration = (startDate, startTime, endDate, endTime) => {
    if (!startDate || !startTime || !endDate || !endTime) {
      return null;
    }

    try {
      const startDateTime = `${startDate}T${startTime}:00`;
      const endDateTime = `${endDate}T${endTime}:00`;

      const start = new Date(startDateTime);
      const end = new Date(endDateTime);

      if (end <= start) {
        return 'Invalid (End before Start)';
      }

      const diffMs = end - start;
      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      // If duration is 24 hours or more, use day format
      if (totalHours >= 24) {
        const days = Math.floor(totalHours / 24);
        const remainingHours = totalHours % 24;

        if (remainingHours === 0 && minutes === 0) {
          return days === 1 ? '1 day' : `${days} days`;
        } else if (remainingHours === 0) {
          return days === 1 ? `1 day ${minutes}m` : `${days} days ${minutes}m`;
        } else if (minutes === 0) {
          return days === 1 ? `1 day ${remainingHours}h` : `${days} days ${remainingHours}h`;
        } else {
          return days === 1 ? `1 day ${remainingHours}h ${minutes}m` : `${days} days ${remainingHours}h ${minutes}m`;
        }
      } else {
        // For durations less than 24 hours, use hour format
        if (totalHours === 0 && minutes === 0) {
          return '0m';
        } else if (totalHours === 0) {
          return `${minutes}m`;
        } else if (minutes === 0) {
          return `${totalHours}h`;
        } else {
          return `${totalHours}h ${minutes}m`;
        }
      }
    } catch (error) {
      return 'Invalid Date/Time';
    }
  };

  // Get real-time duration preview
  const durationPreview = calculateDuration(
    newEvent.startDate,
    newEvent.startTime,
    newEvent.endDate,
    newEvent.endTime
  );

  // Handle adding manual event
  const handleAddEvent = () => {

    try {
      const startDateTime = `${newEvent.startDate}T${newEvent.startTime}:00`;
      const endDateTime = newEvent.endDate && newEvent.endTime 
        ? `${newEvent.endDate}T${newEvent.endTime}:00`
        : null;

      // Calculate duration
      let duration = null;
      if (endDateTime) {
        const startDate = new Date(startDateTime);
        const endDate = new Date(endDateTime);
        if (endDate > startDate) {
          const diffMs = endDate - startDate;
          const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

          // If duration is 24 hours or more, use day format
          if (totalHours >= 24) {
            const days = Math.floor(totalHours / 24);
            const remainingHours = totalHours % 24;

            if (remainingHours === 0 && minutes === 0) {
              duration = days === 1 ? '1 day' : `${days} days`;
            } else if (remainingHours === 0) {
              duration = days === 1 ? `1 day ${minutes}m` : `${days} days ${minutes}m`;
            } else if (minutes === 0) {
              duration = days === 1 ? `1 day ${remainingHours}h` : `${days} days ${remainingHours}h`;
            } else {
              duration = days === 1 ? `1 day ${remainingHours}h ${minutes}m` : `${days} days ${remainingHours}h ${minutes}m`;
            }
          } else {
            // For durations less than 24 hours, use hour format
            if (totalHours === 0 && minutes === 0) {
              duration = '0m';
            } else if (totalHours === 0) {
              duration = `${minutes}m`;
            } else if (minutes === 0) {
              duration = `${totalHours}h`;
            } else {
              duration = `${totalHours}h ${minutes}m`;
            }
          }
        }
      }

      // Create new event object using backend field format
      const manualEvent = {
        event: newEvent.name,
        start: startDateTime,
        end: endDateTime,
        day: new Date(startDateTime).toLocaleDateString('en-US', { weekday: 'long' }),
        duration: duration,
        ship_cargo: newEvent.shipCargo || 'Manual Entry',
        layoff_time: newEvent.layoffTime || 'N/A',
        description: newEvent.description || 'No description',
        filename: 'Manual Entry'
      };

      // Call parent callback to add manual event
      if (onAddManualEvent) {
        onAddManualEvent(manualEvent);
      }

      // Reset form
      setNewEvent({
        name: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: ''
      });
      setShowAddEventForm(false);

    } catch (error) {
      console.error('Error adding event:', error);
      alert('Error adding event. Please check your input format.');
    }
  };

  // Normalize event data to handle backend field names
  const normalizeEvents = (rawEvents) => {
    return rawEvents.map(event => ({
      event: event.event || 'Unknown Event',
      start: event.start || null,
      end: event.end || null,
      day: event.day || null,
      duration: event.duration || null,
      ship_cargo: event.ship_cargo || null,
      layoff_time: event.layoff_time || null,
      description: event.description || 'No description',
      filename: event.filename || null
    }));
  };

  // Sort and filter events
  const processedEvents = normalizeEvents(events)
    .filter(event => {
      const eventMatch = !filterEvent ||
        (event.event && event.event.toLowerCase().includes(filterEvent.toLowerCase()));
      return eventMatch;
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle null/undefined values
      if (!aValue && !bValue) return 0;
      if (!aValue) return sortDirection === 'asc' ? 1 : -1;
      if (!bValue) return sortDirection === 'asc' ? -1 : 1;

      if (sortField === 'start' || sortField === 'end') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
        
        // Handle invalid dates
        if (isNaN(aValue) && isNaN(bValue)) return 0;
        if (isNaN(aValue)) return sortDirection === 'asc' ? 1 : -1;
        if (isNaN(bValue)) return sortDirection === 'asc' ? -1 : 1;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Start editing an event
  const handleStartEdit = (event, processedIndex) => {
    // Find the original index in the events array
    const originalIndex = events.findIndex(originalEvent =>
      originalEvent.event === event.event &&
      originalEvent.start === event.start &&
      originalEvent.end === event.end &&
      originalEvent.description === event.description
    );

    // Parse the existing date/time values properly
    const startDateTime = event.start ? new Date(event.start) : new Date();
    const endDateTime = event.end ? new Date(event.end) : null;

    setEditedEvent({
      ...event,
      startDate: startDateTime.toISOString().split('T')[0], // YYYY-MM-DD format
      startTime: startDateTime.toTimeString().slice(0, 5), // HH:MM format
      endDate: endDateTime ? endDateTime.toISOString().split('T')[0] : '',
      endTime: endDateTime ? endDateTime.toTimeString().slice(0, 5) : '',
      // Recalculate duration
      duration: event.start && event.end ? calculateEditedDuration(event.start, event.end) : null
    });
    setEditingIndex(originalIndex >= 0 ? originalIndex : processedIndex);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedEvent(null);
  };

  // Save edited event
  const handleSaveEdit = () => {
    if (editingIndex !== null && editedEvent) {
      // Ensure date/time combinations are properly formatted
      let finalStart = editedEvent.start;
      let finalEnd = editedEvent.end;
      let finalDuration = editedEvent.duration;

      // Reconstruct datetime strings if needed
      if (editedEvent.startDate && editedEvent.startTime) {
        finalStart = `${editedEvent.startDate}T${editedEvent.startTime}:00`;
      }
      if (editedEvent.endDate && editedEvent.endTime) {
        finalEnd = `${editedEvent.endDate}T${editedEvent.endTime}:00`;
      } else if (!editedEvent.endDate || !editedEvent.endTime) {
        finalEnd = null;
        finalDuration = null;
      }

      // Final duration calculation
      if (finalStart && finalEnd) {
        finalDuration = calculateEditedDuration(finalStart, finalEnd);
      }

      // Create a formatted event to save using backend field names
      const updatedEvent = {
        event: editedEvent.event,
        start: finalStart,
        end: finalEnd,
        day: editedEvent.day,
        duration: finalDuration,
        ship_cargo: editedEvent.ship_cargo,
        layoff_time: editedEvent.layoff_time,
        description: editedEvent.description || 'No description',
        filename: editedEvent.filename
      };

      // Call the parent handler with the updated event and index
      if (onEditEvent) {
        onEditEvent(editingIndex, updatedEvent);
      }

      // Reset edit state
      setEditingIndex(null);
      setEditedEvent(null);
    }
  };  // Helper function to format datetime for raw line
  const formatEditedDateTime = (dateTime) => {
    if (!dateTime) return 'Unknown';
    try {
      const date = new Date(dateTime);
      return date.toLocaleString();
    } catch {
      return String(dateTime);
    }
  };

  // Calculate duration for edited events in real-time
  const calculateEditedDuration = (start, end) => {
    if (!start || !end) return null;

    try {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (endDate <= startDate) {
        return 'Invalid (End before Start)';
      }

      const diffMs = endDate - startDate;
      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      // If duration is 24 hours or more, use day format
      if (totalHours >= 24) {
        const days = Math.floor(totalHours / 24);
        const remainingHours = totalHours % 24;

        if (remainingHours === 0 && minutes === 0) {
          return days === 1 ? '1 day' : `${days} days`;
        } else if (remainingHours === 0) {
          return days === 1 ? `1 day ${minutes}m` : `${days} days ${minutes}m`;
        } else if (minutes === 0) {
          return days === 1 ? `1 day ${remainingHours}h` : `${days} days ${remainingHours}h`;
        } else {
          return days === 1 ? `1 day ${remainingHours}h ${minutes}m` : `${days} days ${remainingHours}h ${minutes}m`;
        }
      } else {
        // For durations less than 24 hours, use hour format
        if (totalHours === 0 && minutes === 0) {
          return '0m';
        } else if (totalHours === 0) {
          return `${minutes}m`;
        } else if (minutes === 0) {
          return `${totalHours}h`;
        } else {
          return `${totalHours}h ${minutes}m`;
        }
      }
    } catch (error) {
      return 'Invalid Date/Time';
    }
  };

  // Handle input changes for editing with real-time duration calculation
  const handleEditChange = (field, value) => {
    setEditedEvent(prev => {
      const updated = { ...prev, [field]: value };

      // When date/time fields change, update the combined datetime and recalculate duration
      if (['startDate', 'startTime', 'endDate', 'endTime'].includes(field)) {
        // Update combined datetime fields
        if (field === 'startDate' || field === 'startTime') {
          if (updated.startDate && updated.startTime) {
            updated.start = `${updated.startDate}T${updated.startTime}:00`;
          }
        }
        if (field === 'endDate' || field === 'endTime') {
          if (updated.endDate && updated.endTime) {
            updated.end = `${updated.endDate}T${updated.endTime}:00`;
          } else if (!updated.endDate || !updated.endTime) {
            updated.end = null;
          }
        }

        // Recalculate duration if both start and end are available
        if (updated.start && updated.end) {
          updated.duration = calculateEditedDuration(updated.start, updated.end);
        } else {
          updated.duration = null;
        }
      }

      return updated;
    });
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not specified';
    try {
      const date = new Date(dateTime);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      return dateTime;
    }
  };

  const formatDate = (dateTime) => {
    if (!dateTime) return 'Not specified';
    try {
      const date = new Date(dateTime);
      return format(date, 'EEEE'); // This will show full weekday name like "Monday", "Tuesday"
    } catch {
      return dateTime;
    }
  };

  const getEventTypeColor = (eventType) => {
    // Handle undefined or null eventType
    if (!eventType || typeof eventType !== 'string') {
      return 'bg-gray-100 text-gray-800';
    }
    
    const type = eventType.toLowerCase();
    if (type.includes('arrival') || type.includes('arrived')) {
      return 'bg-green-100 text-green-800';
    } else if (type.includes('departure') || type.includes('departed')) {
      return 'bg-blue-100 text-blue-800';
    } else if (type.includes('loading') || type.includes('discharge')) {
      return 'bg-purple-100 text-purple-800';
    } else if (type.includes('anchor')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (type.includes('pilot') || type.includes('tug')) {
      return 'bg-indigo-100 text-indigo-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header with actions - Responsive */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="w-full lg:w-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Extracted Events
          </h2>
          <p className="text-sm sm:text-base text-white/80">
            {processedEvents.length} events found in the document
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <button
            onClick={() => setShowAddEventForm(!showAddEventForm)}
            className="inline-flex items-center justify-center px-4 py-2 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-all duration-300 flex-1 sm:flex-none"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Event</span>
            <span className="sm:hidden">Add</span>
          </button>

          {onViewTimeline && (
            <button
              onClick={onViewTimeline}
              className="inline-flex items-center justify-center px-4 py-2 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20 flex-1 sm:flex-none"
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Timeline View</span>
              <span className="sm:hidden">Timeline</span>
            </button>
          )}

          <button
            onClick={() => onExport('csv')}
            className="inline-flex items-center justify-center px-4 py-2 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20 flex-1 sm:flex-none"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>

          <button
            onClick={() => onExport('json')}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600 transition-all duration-300 flex-1 sm:flex-none"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export JSON</span>
            <span className="sm:hidden">JSON</span>
          </button>
        </div>
      </div>

      {/* Filters - Responsive */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Filter by Event Type
            </label>
            <input
              type="text"
              placeholder="Enter event type..."
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-full text-white placeholder-white/60 focus:border-blue-300 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* Add Event Form */}
      {showAddEventForm && (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Manual Event
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-white mb-2">
                Event Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Arrived at berth, Loading commenced"
                value={newEvent.name}
                onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-full text-white placeholder-white/60 focus:border-blue-300 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none backdrop-blur-sm"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                placeholder="e.g., Additional details about the event..."
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-2xl text-white placeholder-white/60 focus:border-blue-300 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none backdrop-blur-sm resize-vertical"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={(newEvent.startDate || '').toString().replace(/^['\"]+|['\"]+$/g, '')}
                onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-full text-white focus:border-blue-300 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none backdrop-blur-sm"
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-white mb-2">
                Start Time *
              </label>
              <ClockPicker
                value={newEvent.startTime}
                onChange={(time) => setNewEvent({...newEvent, startTime: time})}
                placeholder="Select start time"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                End Date
              </label>
              <input
                type="date"
                value={(newEvent.endDate || '').toString().replace(/^['\"]+|['\"]+$/g, '')}
                onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-full text-white focus:border-blue-300 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                End Time
              </label>
              <ClockPicker
                value={newEvent.endTime}
                onChange={(time) => setNewEvent({...newEvent, endTime: time})}
                placeholder="Select end time"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Ship/Cargo
              </label>
              <input
                type="text"
                placeholder="e.g., MV Ocean Pride, Container shipment"
                value={newEvent.shipCargo}
                onChange={(e) => setNewEvent({...newEvent, shipCargo: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-full text-white placeholder-white/60 focus:border-blue-300 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Layoff Time
              </label>
              <input
                type="text"
                placeholder="e.g., 2h 30m, 1h 15m"
                value={newEvent.layoffTime}
                onChange={(e) => setNewEvent({...newEvent, layoffTime: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-full text-white placeholder-white/60 focus:border-blue-300 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Duration Preview */}
          {durationPreview && (
            <div className="mt-4 p-4 bg-blue-500/20 rounded-xl border border-blue-300/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-200">Calculated Duration:</span>
                <span className={`text-lg font-bold ${
                  durationPreview.includes('Invalid') ? 'text-red-300' : 'text-blue-200'
                }`}>
                  {durationPreview}
                </span>
              </div>
              {durationPreview.includes('Invalid') && (
                <p className="text-xs text-red-200 mt-1">
                  Please ensure end time is after start time
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <button
              onClick={handleAddEvent}
              className="inline-flex items-center justify-center px-6 py-3 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-all duration-300 flex-1 sm:flex-none"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Event
            </button>
            <button
              onClick={() => {
                setShowAddEventForm(false);
                setNewEvent({
                  name: '',
                  description: '',
                  startDate: '',
                  startTime: '',
                  endDate: '',
                  endTime: '',
                  shipCargo: '',
                  layoffTime: ''
                });
              }}
              className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20 flex-1 sm:flex-none"
            >
              Cancel
            </button>
          </div>

          <p className="text-sm text-white/60 mt-3">
            * Required fields. Duration will be calculated automatically and shown in real-time. Durations over 24 hours will be displayed in days format (e.g., "2 days 3h 30m").
          </p>
        </div>
      )}

      {/* Mobile Card View - Show on small screens */}
      <div className="block lg:hidden space-y-3">
        {processedEvents.map((event, index) => {
          const duration = event.start && event.end
            ? (() => {
              try {
                const startDate = new Date(event.start);
                const endDate = new Date(event.end);
                const diffMs = endDate - startDate;
                const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                // If duration is 24 hours or more, use day format
                if (totalHours >= 24) {
                  const days = Math.floor(totalHours / 24);
                  const remainingHours = totalHours % 24;

                  if (remainingHours === 0 && minutes === 0) {
                    return days === 1 ? '1 day' : `${days} days`;
                  } else if (remainingHours === 0) {
                    return days === 1 ? `1 day ${minutes}m` : `${days} days ${minutes}m`;
                  } else if (minutes === 0) {
                    return days === 1 ? `1 day ${remainingHours}h` : `${days} days ${remainingHours}h`;
                  } else {
                    return days === 1 ? `1 day ${remainingHours}h ${minutes}m` : `${days} days ${remainingHours}h ${minutes}m`;
                  }
                } else {
                  // For durations less than 24 hours, use hour format
                  if (totalHours === 0 && minutes === 0) {
                    return '0m';
                  } else if (totalHours === 0) {
                    return `${minutes}m`;
                  } else if (minutes === 0) {
                    return `${totalHours}h`;
                  } else {
                    return `${totalHours}h ${minutes}m`;
                  }
                }
              } catch {
                return 'N/A';
              }
            })()
            : 'N/A';

          return (
            <div key={index} className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 border-l-4 border-l-blue-300 relative">
              <div className="space-y-3">
                {/* Event Type Badge */}
                <div className="flex items-start justify-between">
                  <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${getEventTypeColor(event.event)}
                  `}>
                    {event.event}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onDeleteEvent && onDeleteEvent(index)}
                      className="group p-2 rounded-full hover:bg-red-500/20 transition-colors"
                      title="Delete event"
                    >
                      <TrashIcon className="h-4 w-4 text-white/60 group-hover:text-red-500 transition-colors" />
                    </button>
                    <span className="text-xs text-white/60">#{index + 1}</span>
                  </div>
                </div>

                {/* Day and Times */}
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center text-white/80">
                    <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="font-medium">Date: {event.day || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-white/80">
                    <span className="mr-2" />
                    <span>Start: {formatDateTime(event.start)}</span>
                  </div>
                  {event.end && formatDateTime(event.end) !== 'Not specified' && (
                    <div className="flex items-center text-white/80">
                      <span className="mr-2" />
                      <span>End: {formatDateTime(event.end)}</span>
                    </div>
                  )}
                  {event.duration && event.duration !== 'N/A' && (
                    <div className="flex items-center text-white/80">
                      <span className="mr-2" />
                      <span className="font-medium">Duration: {event.duration}</span>
                    </div>
                  )}
                  {event.ship_cargo && event.ship_cargo !== 'N/A' && (
                    <div className="flex items-center text-white/80">
                      <span className="mr-2" />
                      <span>Ship/Cargo: {event.ship_cargo}</span>
                    </div>
                  )}
                  {event.layoff_time && event.layoff_time !== 'N/A' && (
                    <div className="flex items-center text-white/80">
                      <span className="mr-2" />
                      <span>Layoff Time: {event.layoff_time}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="text-sm text-white/90 bg-white/10 p-3 rounded-md">
                  {event.description || 'No description'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View - Hide on small screens */}
      <div className="hidden lg:block bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/20">
            <thead className="bg-white/10">
              <tr>
                <th
                  className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('event')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Event</span>
                    {sortField === 'event' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('day')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Day</span>
                    {sortField === 'day' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('start')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Start Time</span>
                    {sortField === 'start' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('end')}
                >
                  <div className="flex items-center space-x-1">
                    <span>End Time</span>
                    {sortField === 'end' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                  Ship/Cargo
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                  Layoff Time
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {processedEvents.map((event, index) => {
                const duration = event.start && event.end
                  ? (() => {
                    try {
                      const startDate = new Date(event.start);
                      const endDate = new Date(event.end);
                      const diffMs = endDate - startDate;
                      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
                      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                      // If duration is 24 hours or more, use day format
                      if (totalHours >= 24) {
                        const days = Math.floor(totalHours / 24);
                        const remainingHours = totalHours % 24;

                        if (remainingHours === 0 && minutes === 0) {
                          return days === 1 ? '1 day' : `${days} days`;
                        } else if (remainingHours === 0) {
                          return days === 1 ? `1 day ${minutes}m` : `${days} days ${minutes}m`;
                        } else if (minutes === 0) {
                          return days === 1 ? `1 day ${remainingHours}h` : `${days} days ${remainingHours}h`;
                        } else {
                          return days === 1 ? `1 day ${remainingHours}h ${minutes}m` : `${days} days ${remainingHours}h ${minutes}m`;
                        }
                      } else {
                        // For durations less than 24 hours, use hour format
                        if (totalHours === 0 && minutes === 0) {
                          return '0m';
                        } else if (totalHours === 0) {
                          return `${minutes}m`;
                        } else if (minutes === 0) {
                          return `${totalHours}h`;
                        } else {
                          return `${totalHours}h ${minutes}m`;
                        }
                      }
                    } catch {
                      return 'N/A';
                    }
                  })()
                  : 'N/A';

                return (
                  <tr 
                  key={index} 
                  className={`hover:bg-white/5 transition-colors ${editingIndex === index ? 'bg-blue-900/30 ring-2 ring-blue-500/50' : ''}`}
                >
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          value={editedEvent.event}
                          onChange={(e) => handleEditChange('event', e.target.value)}
                          className="bg-white/10 border border-white/30 text-white rounded-md px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="flex items-center">
                          <span className={`
                            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${getEventTypeColor(event.event)}
                          `}>
                            {event.event}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-white/90">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          value={editedEvent.day || ''}
                          onChange={(e) => handleEditChange('day', e.target.value)}
                          className="bg-white/10 border border-white/30 text-white rounded-md px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-white/60 mr-2" />
                          {event.day || 'N/A'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-white/90">
                      {editingIndex === index ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-1">
                            <input
                              type="date"
                              value={editedEvent.startDate || ''}
                              onChange={(e) => handleEditChange('startDate', e.target.value)}
                              className="bg-white/10 border border-white/30 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="time"
                              value={editedEvent.startTime || ''}
                              onChange={(e) => handleEditChange('startTime', e.target.value)}
                              className="bg-white/10 border border-white/30 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          {editedEvent.startDate && editedEvent.startTime && editedEvent.endDate && editedEvent.endTime && (
                            <div className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded">
                              Duration: {editedEvent.duration || 'Calculating...'}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="mr-2" />
                          {formatDateTime(event.start)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-white/90">
                      {editingIndex === index ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-1">
                            <input
                              type="date"
                              value={editedEvent.endDate || ''}
                              onChange={(e) => handleEditChange('endDate', e.target.value)}
                              className="bg-white/10 border border-white/30 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="time"
                              value={editedEvent.endTime || ''}
                              onChange={(e) => handleEditChange('endTime', e.target.value)}
                              className="bg-white/10 border border-white/30 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          {editedEvent.startDate && editedEvent.startTime && editedEvent.endDate && editedEvent.endTime && (
                            <div className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded">
                              Duration: {editedEvent.duration || 'Calculating...'}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="mr-2" />
                          {formatDateTime(event.end)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-white/90">
                      <div className="flex items-center">
                        <span className="mr-2" />
                        {editingIndex === index ? (
                          <span className={`font-medium ${
                            editedEvent.duration && editedEvent.duration.includes('Invalid') 
                              ? 'text-red-300' 
                              : 'text-blue-300'
                          }`}>
                            {editedEvent.duration || 'N/A'}
                          </span>
                        ) : (
                          event.duration || 'N/A'
                        )}
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-white/90">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          value={editedEvent.ship_cargo || ''}
                          onChange={(e) => handleEditChange('ship_cargo', e.target.value)}
                          className="bg-white/10 border border-white/30 text-white rounded-md px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="flex items-center">
                          <span className="mr-2" />
                          {event.ship_cargo || 'N/A'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-white/90">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          value={editedEvent.layoff_time || ''}
                          onChange={(e) => handleEditChange('layoff_time', e.target.value)}
                          className="bg-white/10 border border-white/30 text-white rounded-md px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="flex items-center">
                          <span className="mr-2" />
                          {event.layoff_time || 'N/A'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 xl:px-6 py-4 text-sm text-white/90">
                      {editingIndex === index ? (
                        <textarea
                          value={editedEvent.description || ''}
                          onChange={(e) => handleEditChange('description', e.target.value)}
                          className="bg-white/10 border border-white/30 text-white rounded-md px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="2"
                        />
                      ) : (
                        <div className="max-w-xs xl:max-w-sm truncate" title={event.description}>
                          {event.description || 'No description'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-1">
                        {editingIndex === index ? (
                          <>
                            <button 
                              onClick={handleSaveEdit}
                              className="group p-2 rounded-full hover:bg-green-500/20 transition-colors"
                              title="Save changes"
                            >
                              <CheckIcon className="h-4 w-4 text-white/60 group-hover:text-green-500 transition-colors" />
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              className="group p-2 rounded-full hover:bg-yellow-500/20 transition-colors"
                              title="Cancel editing"
                            >
                              <XMarkIcon className="h-4 w-4 text-white/60 group-hover:text-yellow-500 transition-colors" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleStartEdit(event, index)}
                              className="group p-2 rounded-full hover:bg-blue-500/20 transition-colors"
                              title="Edit event"
                            >
                              <PencilIcon className="h-4 w-4 text-white/60 group-hover:text-blue-500 transition-colors" />
                            </button>
                            <button 
                              onClick={() => onDeleteEvent && onDeleteEvent(index)}
                              className="group p-2 rounded-full hover:bg-red-500/20 transition-colors"
                              title="Delete event"
                            >
                              <TrashIcon className="h-4 w-4 text-white/60 group-hover:text-red-500 transition-colors" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="card text-center">
          <div className="text-xl sm:text-2xl font-bold text-maritime-navy">
            {processedEvents.length}
          </div>
          <div className="text-xs sm:text-sm text-maritime-gray-600">Total Events</div>
        </div>
        <div className="card text-center">
          <div className="text-xl sm:text-2xl font-bold text-maritime-navy">
            {processedEvents.filter(e => e.start && e.end).length}
          </div>
          <div className="text-xs sm:text-sm text-maritime-gray-600">With Duration</div>
        </div>
        <div className="card text-center">
          <div className="text-xl sm:text-2xl font-bold text-maritime-navy">
            {new Set(processedEvents.map(e => e.event.toLowerCase())).size}
          </div>
          <div className="text-xs sm:text-sm text-maritime-gray-600">Event Types</div>
        </div>
      </div>
    </div>
  );
};

export default ResultTable;
