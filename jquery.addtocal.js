/*
 * jQuery.addtocal
 * 
 * Copyright (c) 2010 Paul GALLAGHER
 * Dual licensed under the MIT or GPL Version 2 licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *   
 */

(function($) {
  
  $.widget("ui.addtocal", 
  {
    options: {
      appendTo: "body",
      position: {
        my: "left top",
        at: "left bottom",
        collision: "none"
      },
      selectedCalendarTarget: null,
      icalEnabled: true,
      vcalEnabled: true,
      getEventDetails: function( element ) {
        return { 
          webcalurl: 'webcal://site.ics', 
          icalurl: 'http://site.ics', 
          vcalurl: 'http://site.vcs', 
          start: new Date(), end: new Date(), 
          title: null, details: null, 
          location: null, url: null};
      },
      select: function(event, ui) {
        var link; 
        var eventDetails = ui.getEventDetails($(this));
        var 
          title = ( eventDetails.title ? encodeURIComponent( eventDetails.title ) : '' ),
          start = ( typeof eventDetails.start.toRFC3339UTCString == 'function' ?
            eventDetails.start.toRFC3339UTCString(true,true) : eventDetails.start ),
          end = ( typeof  eventDetails.end.toRFC3339UTCString == 'function' ?
            eventDetails.end.toRFC3339UTCString(true,true) : eventDetails.end ),
          location = ( eventDetails.location ? encodeURIComponent( eventDetails.location ) : '' ),
          details = ( eventDetails.details ? encodeURIComponent( eventDetails.details ) : '' ),
          url = ( eventDetails.url ? encodeURIComponent( eventDetails.url ) : '' );
          
        switch( ui.selectedCalendarTarget ) {
        case 1: //google
          link = "http://www.google.com/calendar/event?action=TEMPLATE&trp=false" +
          "&text=" + title + 
          "&dates=" + start + 
          "/" + end +
          "&location=" + location +
          "&details=" + details +
          "&sprop=" + url;
          break;
        case 2:// yahoo 
          link="http://calendar.yahoo.com/?v=60" + 
          "&DUR=0400" +
          "&TITLE=" + title + 
          "&ST=" + start +  
          "&in_loc=" + location +
          "&DESC=" + details +
          "&URL=" + url;
          break;
        case 3:// live 
          link="http://calendar.live.com/calendar/calendar.aspx?rru=addevent" +
          "&dtstart=" + start +
          "&dtend=" + end +
          "&summary=" + title + 
          "&location=" + location;
          break;
        case 4:// 30boxes 
          link=( eventDetails.webcalurl ? 
            "http://30boxes.com/add.php?webcal=" + encodeURIComponent( eventDetails.webcalurl ) : null );
          break;
        case 5:// iCal 
          link=( eventDetails.icalurl ? eventDetails.icalurl : null );
          break;
        case 6:// vCal 
          link=( eventDetails.vcalurl ? eventDetails.vcalurl : null );
          break;
        default:
        }
        if(link) window.open(link);
      },
    },
    _create: function() {
      var self = this,
      	doc = this.element[ 0 ].ownerDocument;
      this.element
      	.addClass( "ui-addtocal" )
      	.bind( "click.addtocal", function( event ) {
      	  event.preventDefault();
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
      			self._trigger( "select", event, self.options ); // , self.options.getEventDetails( $(this) )
      
      			self.close( event );
      			self.selectedItem = item;
      		}
      	})
      	.zIndex( this.element.zIndex() + 1 )
      	// workaround for jQuery bug #5781 http://dev.jquery.com/ticket/5781
      	.css({ top: 0, left: 0 })
      	.hide()
      	.data( "menu" );
      if ( $.fn.bgiframe ) {
      	 this.menu.element.bgiframe();
      }
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
      this.source = [ 
        {value: 1, label:"Add to Google Calendar"}, 
        {value: 2, label:"Add to Live Calendar"}, 
        {value: 3, label:"Add to Yahoo! Calendar"} ]
      if(this.options.icalEnabled) this.source.push( {value: 4, label:"Add to 30boxes"}, {value: 5, label:"iCal" } );
      if(this.options.vcalEnabled) this.source.push( {value: 6, label:"vCalendar"} );
    },
  
    toggleMenu: function( event ) {
      content = this.source;
      if ( content.length && ! ( this.menu.element.is(":visible") ) ) {
        $('.ui-addtocal').addtocal( 'close' );
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

