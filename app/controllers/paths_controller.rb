class PathsController < ApplicationController
  def index
  end

  def nodes
    output = []
    Path.select(:origin).distinct.each do |p|
      output << {"name" => p.origin}
    end
  end

  def data
    @json = []
    Path.all.each do |p|
      @json << { "source" => p.origin,
                 "target" => p.destination,
                 "value" => p.distance }
    end                                                                 

    respond_to do |format|
      format.json { render :json => @json.to_json }
    end

    def find_paths
      @answer = {"a" => "b"}.to_json

      nodes = {}
      Path.select(:origin).distinct.each do |p|
        nodes[p.origin] = {}
      end

      Path.all.each do |p|
        nodes[p.origin][p.destination] = p.distance
      end

      def search(node, destination, hash, current_list, cost, solutions)
        if node == destination
          solutions << [current_list, cost, current_list.length - 1]
          return
        end
        hash[node].each do |pair|
           unless current_list.include? pair[0]
             search(pair[0], destination, hash, current_list << pair[0], cost + pair[1], solutions)
             current_list = current_list[0...current_list.index(pair[0])]
           end
        end
      end

      solutions = []
      search(params["data"]["source"], params["data"]["target"], nodes, [params["data"]["source"]], 0, solutions)
      solutions.sort! { |a, b| a[1] <=> b[1] }

      render json: solutions.to_json
    end
  end
end
