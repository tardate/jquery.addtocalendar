/*
 * jQuery.addtocal v0.1.2
 * http://github.com/tardate/jquery.addtocalendar
 *
 * Copyright (c) 2010 Paul GALLAGHER http://tardate.com
 * Dual licensed under the MIT or GPL Version 2 licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

(function($) {

  $.widget("tardate.AddToCal",
  {
    options: {

      /*
       * calendars is a collection of all the supported calendars and the method for formating
       * the calendar link in each case. If you want to use a calendar system not supported here, you can
       * extend or modify this array as required in widget setup.
       */
      calendars : [
        {value: 1,
          label:"Add to Google Calendar",
          enabled : function(addtocal) { return true; },
          formatlink : function(eventDetails) {
            return "http://www.google.com/calendar/event?action=TEMPLATE&trp=false" +
            "&text=" + eventDetails.title +
            "&dates=" + eventDetails.start +
            "/" + eventDetails.end +
            "&location=" + eventDetails.location +
            "&details=" + eventDetails.details +
            "&sprop=" + eventDetails.url;
          } },
        {value: 2, label:"Add to Live Calendar",
          enabled : function(addtocal) { return true; },
          formatlink : function(eventDetails) {
            return "http://calendar.live.com/calendar/calendar.aspx?rru=addevent" +
            "&dtstart=" + eventDetails.start +
            "&dtend=" + eventDetails.end +
            "&summary=" + eventDetails.title +
            "&location=" + eventDetails.location;
          } },
        {value: 3, label:"Add to Yahoo! Calendar",
          enabled : function(addtocal) { return true; },
          formatlink : function(eventDetails) {
            var minsDuration = ( Date.parse(eventDetails.end) - Date.parse(eventDetails.start) ) / 60 / 1000;
            var durationString = (minsDuration / 60).toPaddedString(2) + (minsDuration%60).toPaddedString(2);
            return "http://calendar.yahoo.com/?v=60" +
            "&DUR=" + durationString +
            "&TITLE=" + eventDetails.title +
            "&ST=" + eventDetails.start +
            "&in_loc=" + eventDetails.location +
            "&DESC=" + eventDetails.details +
            "&URL=" + eventDetails.url;
          } },
        {value: 4, label:"Add to 30boxes",
          enabled : function(addtocal) { return addtocal.options.icalEnabled; },
          formatlink : function(eventDetails) {
            return ( eventDetails.webcalurl ?
            "http://30boxes.com/add.php?webcal=" + encodeURIComponent( eventDetails.webcalurl ) : null );
          } },
        {value: 5, label:"iCal",
          enabled : function(addtocal) { return addtocal.options.icalEnabled; },
          formatlink : function(eventDetails) {
            return (eventDetails.icalurl ? eventDetails.icalurl : null);
          } },
        {value: 6, label:"vCalendar",
          enabled : function(addtocal) { return addtocal.options.vcalEnabled; },
          formatlink : function(eventDetails) {
            return ( eventDetails.vcalurl ? eventDetails.vcalurl : null );
          } }
      ],

      /* icalEnabled: set if iCal links are to be supported (requires you to provide an iCal format resource) */
      icalEnabled: true,
      /* vcalEnabled: set if vCalendar links are to be supported (requires you to provide an vCalendar format resource) */
      vcalEnabled: true,

      /* getEventDetails is the most critical function to provide.
       * It is called when a user selects a calendar to add an event to.
       * The element parameter is the jQuery object for the event invoked.
       * You must return an object packed with the relevant event details.
       * How you determine the event attributes will depend on your page.
       * The example below illustrates how to handle two formats of event markup.
       */
      getEventDetails: function( element ) {
        return {
          webcalurl: 'webcal://site.ics',
          icalurl: 'http://site.ics',
          vcalurl: 'http://site.vcs',
          start: new Date(),
          end: new Date(),
          title: null, details: null,
          location: null, url: null};
      },


      /*
       * sanitizeEventDetails cleans up and normalises the event details provided by getEventDetails
       */
      sanitizeEventDetails: function( eventDetails ) {
        eventDetails.title = ( eventDetails.title ? encodeURIComponent( eventDetails.title ) : '' );
        eventDetails.start = ( typeof eventDetails.start.toRFC3339UTCString == 'function' ?
          eventDetails.start.toRFC3339UTCString(true,true) : eventDetails.start );
        eventDetails.end = ( typeof  eventDetails.end.toRFC3339UTCString == 'function' ?
          eventDetails.end.toRFC3339UTCString(true,true) : eventDetails.end );
        eventDetails.location = ( eventDetails.location ? encodeURIComponent( eventDetails.location ) : '' );
        eventDetails.details = ( eventDetails.details ? encodeURIComponent( eventDetails.details ) : '' );
        // avoid 414 error due to overlong url
        var MAX_DETAILS_LENGTH = 1550;
        if (eventDetails.details.length > MAX_DETAILS_LENGTH) {
          eventDetails.details = eventDetails.details.substr(0, MAX_DETAILS_LENGTH);
          eventDetails.details.replace(/%[^0-9]*$/, "");
          eventDetails.details += "...";
        }
        eventDetails.url = ( eventDetails.url ? encodeURIComponent( eventDetails.url ) : '' );
        return eventDetails;
      },

      /* records the currently selected calendar service */
      selectedCalendarTarget: null,
      /* positioning of the addtocal widget */
      appendTo: "body",
      position: {
        my: "left top",
        at: "left bottom",
        collision: "none"
      },

      /* main method called on selection of calendar service */
      select: function(event, ui) {
        var eventDetails = ui.sanitizeEventDetails( ui.getEventDetails($(this)) );
        var calendar_provider = $.grep(ui.calendars, function(element, index){
          return (element.value == ui.selectedCalendarTarget);
        });
        var link =  calendar_provider[0].formatlink(eventDetails);
        if(link) window.open(link);
      }
    },

    source:[],

    _create: function() {
      var self = this,
      	doc = this.element[ 0 ].ownerDocument;
      this.element
      	.addClass( "ui-addtocal" )
      	.bind( "click.addtocal", function( event ) {
      	  event.preventDefault();
      	  event.stopPropagation();
      	  self.toggleMenu();
      	});
      this._initSource();

      this.menu = $( "<ul></ul>" )
      	.addClass( "ui-addtocal" )
      	.appendTo( $( this.options.appendTo || "body", doc )[0] )
      	.menu({
      		selected: function( event, ui ) {
      			var item = ui.item.data( "item.addtocal" ),
      				previous = self.previous;

      			// only trigger when focus was lost (click on menu)
      			if ( self.element[0] !== doc.activeElement ) {
      				self.element.focus();
      				self.previous = previous;
      			}
            self.options.selectedCalendarTarget = item.value;
      			self._trigger( "select", event, self.options );

      			self.close( event );
      			self.selectedItem = item;
      		}
      	})
      	.zIndex( this.element.zIndex() + 1 )
      	.css({ top: 0, left: 0 })
      	.hide()
      	.data( "menu" );

      if ( $.fn.bgiframe ) {
      	 this.menu.element.bgiframe();
      }

      //Close the popup if click elsewhere in the window
      $(document).bind("click", function(event, ui) { self.close( event ); });

    },

    destroy: function() {
      this.element
      	.removeClass( "ui-addtocal" );
      this.menu.element.remove();
      $.Widget.prototype.destroy.call( this );
    },

    _setOption: function( key, value ) {
      $.Widget.prototype._setOption.apply( this, arguments );
      if ( key === "appendTo" ) {
      	this.menu.element.appendTo( $( value || "body", this.element[0].ownerDocument )[0] )
      }
    },

    _initSource: function() {
      var self = this;
      self.source=[];
      $.each( this.options.calendars, function(index, value) {
        if(value.enabled(self)) self.source.push( {value: value.value, label: value.label } );
      });
    },

    toggleMenu: function( event ) {
      var content = this.source;
      if ( content.length && ! ( this.menu.element.is(":visible") ) ) {
        $('.ui-addtocal').AddToCal( 'close' );
      	content = this._normalize( content );
      	this._suggest( content );
      	this._trigger( "open" );
      } else {
      	this.close();
      }
    },

    close: function( event ) {
      clearTimeout( this.closing );
      if ( this.menu.element.is(":visible") ) {
      	this._trigger( "close", event );
      	this.menu.element.hide();
      	this.menu.deactivate();
      }
    },

    _normalize: function( items ) {
      // assume all items have the right format when the first item is complete
      if ( items.length && items[0].label && items[0].value ) {
      	return items;
      }
      return $.map( items, function(item) {
      	if ( typeof item === "string" ) {
      		return {
      			label: item,
      			value: item
      		};
      	}
      	return $.extend({
      		label: item.label || item.value,
      		value: item.value || item.label
      	}, item );
      });
    },

    _suggest: function( items ) {
      var ul = this.menu.element
      		.empty()
      		.zIndex( this.element.zIndex() + 1 ),
      	menuWidth,
      	textWidth;
      this._renderMenu( ul, items );
      // TODO refresh should check if the active item is still in the dom, removing the need for a manual deactivate
      this.menu.deactivate();
      this.menu.refresh();
      this.menu.element.show().position( $.extend({
      	of: this.element
      }, this.options.position ));

      menuWidth = ul.width( "" ).outerWidth();
      textWidth = this.element.outerWidth();
      ul.outerWidth( Math.max( menuWidth, textWidth ) );
    },

    _renderMenu: function( ul, items ) {
      var self = this;
      $.each( items, function( index, item ) {
      	self._renderItem( ul, item );
      });
    },

    _renderItem: function( ul, item) {
      return $( "<li></li>" )
      	.data( "item.addtocal", item )
      	.append( $( "<a></a>" ).text( item.label ) )
      	.appendTo( ul );
    },

    widget: function() {
      return this.menu.element;
    }

  });

}(jQuery));

