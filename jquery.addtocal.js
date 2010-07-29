/*
 * jQuery.addtocal v1.0-dev
 *
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
		start: function( element ) {
		},
		end: function( element ) {
		},
		title: function( element ) {
		  return 'test';
		},
		details: function( element ) {
		},
		location: function( element ) {
		},
		url: function( element ) {
		},
		select: function(event, ui) {
      var url;
      switch(ui.item.value)
      {
      case 1: //google
        url = "http://www.google.com/calendar/event?action=TEMPLATE&text=" + ui.title + "&dates=STARTDATE/ENDDATE" +
        "&location=VENUE&details=FULL BAND LIST&trp=false&sprop=LINK TO LMS GIG PAGE&sprop=name:LEEDS MUSIC SCENE";
        break;
      case 2:// yahoo 
        url="http://calendar.yahoo.com/?v=60&DUR=0400&TITLE=" + ui.title + "&ST=STARTTIME" +
      "&in_loc=VENUE&DESC=FULL BAND LIST&URL=LINK TO LMS GIG PAGE";
        break;
      case 3:// live 
        url ="http://calendar.live.com/calendar/calendar.aspx?rru=addevent&dtstart=20090106T190000Z&dtend=20090106T200000Z&summary=" + ui.title + "&location=location";
        break;
      case 4:// 30boxes 
        url="http://30boxes.com/add.php?webcal=webcal://LINKTOICALFILE";
        break;
      case 5:// iCal 
        url="webcal://LINKTOICALFILE";
        break;
      default:
        
      }

      window.open(url, '_blank');
    },
	},
	_create: function() {
		var self = this,
			doc = this.element[ 0 ].ownerDocument;
		this.element
			.addClass( "ui-addtocal" )
			.bind( "click.addtocal", function( event ) {
			  self.toggleMenu();
			});
		this._initSource();

		this.menu = $( "<ul></ul>" )
			.addClass( "ui-addtocal" )
			.appendTo( $( this.options.appendTo || "body", doc )[0] )
			// prevent the close-on-blur in case of a "slow" click on the menu (long mousedown)
			.mousedown(function() {
				// use another timeout to make sure the blur-event-handler on the input was already triggered
				setTimeout(function() {
					clearTimeout( self.closing );
				}, 13);
			})
			.menu({
				selected: function( event, ui ) {
					var item = ui.item.data( "item.addtocal" ),
						previous = self.previous;

					// only trigger when focus was lost (click on menu)
					if ( self.element[0] !== doc.activeElement ) {
						self.element.focus();
						self.previous = previous;
					}

					self._trigger( "select", event, 
					  { 
					    item: item, 
					    title: self.options.title( self ) ,
					    start: self.options.start( self ) ,
					    end: self.options.end( self ) ,
					    details: self.options.details( self ) ,
					    location: self.options.location( self ) ,
					    url: self.options.url( self )
					  } );

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
		  {value: 3, label:"Add to Yahoo! Calendar"}, 
		  {value: 2, label:"Add to 30boxes"}, 
	    {value: 4, label:"iCal" } ];
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

