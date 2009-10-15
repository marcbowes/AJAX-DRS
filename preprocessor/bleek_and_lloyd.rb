require 'rexml/document'
require 'activerecord'

ActiveRecord::Base.establish_connection({
  'adapter'  => 'mysql',
  'encoding' => 'utf8',
  'host'     => 'localhost',
  'database' => 'bal',
  'username' => 'root',
  'password' => '',
  'socket'   => '/var/run/mysqld/mysqld.sock'
})

def normalize(filename)
  doc   = REXML::Document.new(File.new(filename))
  root  = doc.root
  
  # "Top-down" load, although it's 
end

class Caljaxize
  
end

class Collection < ActiveRecord::Base
  has_many :books
  
  #
  # attributes:
  # - name
  #
end

class Book < ActiveRecord::Base
  belongs_to :collection
  
  has_many :pages
  
  #
  # attributes:
  # - name:string
  # - collection:references
  # - first_page:references
  # - last_page:references
  #
  
  def first_page
    Page.find(self.first_page_id)
  end
  
  def last_page
    Page.find(self.last_page_id)
  end
end

class Category < ActiveRecord::Base
  has_many :stories
  
  #
  # attributes:
  # - name:string
  #
end

class Author < ActiveRecord::Base
  has_many :stories
  
  #
  # attributes:
  # - name:string
  #
end

class Story < ActiveRecord::Base
  belongs_to :collection
  belongs_to :category
  belongs_to :author
  
  #
  # attributes:
  # - id:integer
  # - title:string
  # - summary:text
  # - comments:text
  # - date:string
  # - storypages:string
  # - keywords:text
  # - subkeywords:text
  # - collection:references
  # - category:references
  # - author:references
  #
end

class Page < ActiveRecord::Base
  belongs_to :story
  
  #
  # attributes:
  # - name:string
  # - book:references
  #
end

class CreateTables < ActiveRecord::Migration
  def self.up
    create_table :collections do |t|
      t.string :name
    end
    
    create_table :books do |t|
      t.string :name
      t.references :collection
      t.references :first_page
      t.references :last_page
    end
    
    create_table :categories do |t|
      t.string :name
    end
    
    create_table :authors do |t|
      t.string :name
    end
    
    create_table :stories do |t|
      t.string :title
      t.string :summary
      t.string :comments
      t.string :date
      t.string :storypages
      t.string :keywords
      t.string :subkeywords
      t.references :collection
      t.references :category
      t.references :author
    end
    
    create_table :pages do |t|
      t.string :name
      t.references :book
    end
  end
  
  def self.down
    [:collections, :books, :categories, :authors, :stories, :pages].each do |name|
      drop_table name
    end
  end
end
